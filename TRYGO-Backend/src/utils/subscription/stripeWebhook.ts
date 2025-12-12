import Stripe from 'stripe';
import subscriptionService from '../../services/subscription/SubscriptionService';
import { config } from '../../constants/config/env';

// Stripe инициализируется только если ключ установлен
const stripe = config.STRIPE_SECRET_KEY 
    ? new Stripe(config.STRIPE_SECRET_KEY)
    : null;

export const stripeWebhook = async (req: any, res: any) => {
    if (!stripe || !config.STRIPE_WEBHOOK_SECRET) {
        return res.status(503).send('Stripe webhook is not configured');
    }
    
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            req.headers['stripe-signature'],
            config.STRIPE_WEBHOOK_SECRET
        );
        const dataObject = event.data.object as any;

        if (dataObject['billing_reason'] == 'subscription_create') {
            const subscription_id = dataObject['subscription'];
            const payment_intent_id = dataObject['payment_intent'];

            const payment_intent = (await stripe.paymentIntents.retrieve(
                payment_intent_id
            )) as any;

            await stripe.subscriptions.update(subscription_id, {
                default_payment_method: payment_intent.payment_method,
            });

            await stripe.customers.update(payment_intent.customer, {
                invoice_settings: {
                    default_payment_method: payment_intent.payment_method,
                },
            });
        }

        const session = event.data.object as Stripe.Checkout.Session;
        switch (event.type as any) {
            case 'customer.subscription.created':
                await subscriptionService.approveSubscriptionPayment(
                    res,
                    session.id as string,
                    stripe
                );

                break;
            case 'invoice_payment.paid':
            case 'invoice.paid':
                await subscriptionService.invoicePaid(
                    dataObject,
                    session,
                    stripe
                );
                // Removed verbose logging

                break;
            case 'invoice.payment_failed':
                await subscriptionService.invoicePaymentFailed(dataObject);
                // Removed verbose logging

                break;
            case 'customer.subscription.updated':
                await subscriptionService.subscriptionUpdated(
                    dataObject,
                    session,
                    stripe
                );
                // Removed verbose logging

                break;
            case 'customer.subscription.deleted':
                await subscriptionService.subscriptionDeleted(dataObject);
                // Removed verbose logging

                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
                throw new Error(`Unhandled event type: ${event.type}`);
        }
        res.sendStatus(200);
    } catch (err: any) {
        console.log(`❌ Error message: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};
