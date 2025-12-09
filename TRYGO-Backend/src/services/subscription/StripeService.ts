import Stripe from 'stripe';
import { config } from '../../constants/config/env';
import { SubscriptionType } from '../../generated/graphql';
const stripe = new Stripe(config.STRIPE_SECRET_KEY as string);

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
