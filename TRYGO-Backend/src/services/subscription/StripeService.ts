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
            // Check if customer exists in Stripe before creating portal session
            // This handles cases where customerId is invalid (e.g., manual_customer_* or deleted customer)
            if (stripeCustomerId.startsWith('manual_customer_')) {
                throw new Error(`Invalid Stripe customer ID: ${stripeCustomerId}. This appears to be a manual/test customer ID. Please contact support.`);
            }
            
            try {
                // Verify customer exists in Stripe
                await stripe.customers.retrieve(stripeCustomerId);
            } catch (retrieveError: any) {
                if (retrieveError?.code === 'resource_missing') {
                    throw new Error(`Stripe customer not found: ${stripeCustomerId}. The customer may have been deleted or the email may have changed.`);
                }
                throw retrieveError;
            }
            
            return await stripe.billingPortal.sessions.create({
                customer: stripeCustomerId,
                return_url: config.FRONTEND_URL,
            });
        } catch (err) {
            console.error('[StripeService] Error creating billing portal:', err);
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
