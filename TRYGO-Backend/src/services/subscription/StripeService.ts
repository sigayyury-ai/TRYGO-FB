import Stripe from 'stripe';
import { config } from '../../constants/config/env';
import { SubscriptionType } from '../../generated/graphql';

// Stripe инициализируется только если ключ установлен
const stripe = config.STRIPE_SECRET_KEY 
    ? new Stripe(config.STRIPE_SECRET_KEY as string)
    : null;

const defaultFields = (
    clientReferenceId: string,
    email: string
): Stripe.Checkout.SessionCreateParams => ({
    payment_method_types: ['card'],
    mode: 'subscription',
    client_reference_id: clientReferenceId.toString(),
    allow_promotion_codes: true,
    success_url: `${config.FRONTEND_URL}`,
    cancel_url: `${config.FRONTEND_URL}`,
    customer_email: email,
});

class StripeService {
    async createStripeSubscriptionCheckout(
        clientReferenceId: string,
        email: string,
        type: SubscriptionType
    ) {
        if (!stripe) {
            throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
        }
        try {
            if (type === SubscriptionType.Starter) {
                return await stripe.checkout.sessions.create({
                    ...defaultFields(clientReferenceId, email),
                    line_items: [
                        {
                            price: config.STRIPE_STARTER_MONTHLY_PRICE_ID,
                            quantity: 1,
                        },
                    ],
                });
            } else if (type === SubscriptionType.Pro) {
                return await stripe.checkout.sessions.create({
                    ...defaultFields(clientReferenceId, email),
                    line_items: [
                        {
                            price: config.STRIPE_PRO_MONTHLY_PRICE_ID,
                            quantity: 1,
                        },
                    ],
                });
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async createStripeBillingPortal(stripeCustomerId: string) {
        if (!stripe) {
            throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
        }
        try {
            return await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: config.FRONTEND_URL,
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async changeSubscriptionType(
        stripeSubscriptionId: string,
        type: SubscriptionType
    ) {
        if (!stripe) {
            throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
        }
        try {
            const existingSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const subscriptionItemId = existingSubscription.items.data[0].id; 
            return await stripe.subscriptions.update(stripeSubscriptionId, {
                items: [
                    {
                        id: subscriptionItemId,
                        price:
                            type === SubscriptionType.Pro
                                ? config.STRIPE_PRO_MONTHLY_PRICE_ID
                                : config.STRIPE_STARTER_MONTHLY_PRICE_ID,
                    },
                ],
            });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }
}

const stripeService = new StripeService();
export default stripeService;
