import SubscriptionModel from '../../models/SubscriptionModel';
import { elevateError } from '../../errors/elevateError';
import {
    Subscription,
    SubscriptionStatus,
    SubscriptionType,
} from '../../generated/graphql';
import stripeService from './StripeService';
import Stripe from 'stripe';
import userService from '../UserService';
import mongoose from 'mongoose';
import {
    StripeStatus,
    toSubscriptionStatus,
} from '../../utils/subscription/toSubscriptionStatus';
import { config } from '../../constants/config/env';

class SubscriptionService {
    private model: typeof SubscriptionModel = SubscriptionModel;

    async getNumberubscriptionsPurchasedByDays(
        date: Date,
        subscriptionType: SubscriptionType
    ): Promise<number> {
        try {
            return await this.model.countDocuments({
                createdAt: { $gte: date },
                type: subscriptionType,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getSubscription(userId: string): Promise<Subscription | null> {
        try {
            return await this.model.findOne({ userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getSubscriptionStripeSessionUrl(userId: string): Promise<string> {
        try {
            const subscription = await this.getSubscription(userId);
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            const portalSession = await stripeService.createStripeBillingPortal(
                subscription.customerId
            );

            if (!portalSession) {
                throw new Error(
                    `Failed to create a stripe portal session for user with ID: ${userId}`
                );
            }

            return portalSession.url;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async checkIfSubscriptionExists(userId: string): Promise<void> {
        try {
            const subscription = await this.model.findOne({ userId });
            if (subscription) {
                throw new Error('Subscription already exists');
            }
        } catch (error) {
            elevateError(error);
        }
    }

    async checkIfSubscriptionIsActive(userId: string): Promise<void> {
        try {
            const subscription = await this.model.findOne({ userId });
            if (
                subscription?.status !== SubscriptionStatus.Active &&
                subscription?.status !== SubscriptionStatus.Trialing
            ) {
                throw new Error(
                    'Subscription is not active, please activate subscription'
                );
            }
        } catch (error) {
            elevateError(error);
        }
    }

    async approveSubscriptionPayment(
        res: any,
        subscriptionId: string,
        stripe: Stripe
    ): Promise<void> {
        try {
            const subscription =
                await stripe.subscriptions.retrieve(subscriptionId);
            console.log('subscription', subscription);
            const customer = (await stripe.customers.retrieve(
                subscription.customer as string
            )) as any;
            console.log('customer', customer);
            const email = customer.email as string;
            const user = await userService.getUserByEmail(email as string);
            if (!user) {
                throw new Error('User not found');
            }
            console.log('user', user);
            await this.deleteSubscriptionsByUserId(user.id);
            await this.createSubscriptionModel(stripe, subscriptionId, user.id);
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    async deleteSubscriptionsByUserId(userId: string): Promise<void> {
        try {
            await this.model.deleteMany({ userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async invoicePaid(
        dataObject: any,
        session: Stripe.Checkout.Session,
        stripe: Stripe
    ) {
        try {
            const stripeSubscriptionId = dataObject['subscription'];
            if (!stripeSubscriptionId)
                throw new Error('Subscription in invoice not found');

            const subscriptionDetails = (await this.getSubscriptionDetails(
                stripe,
                stripeSubscriptionId
            )) as any;

            await this.model.findOneAndUpdate(
                { stripeSubscriptionId },
                {
                    status: SubscriptionStatus.Active,
                    endDate: new Date(
                        subscriptionDetails.current_period_end * 1000
                    ),
                }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async invoicePaymentFailed(dataObject: any) {
        try {
            const stripeSubscriptionId = dataObject['subscription'];
            if (!stripeSubscriptionId)
                throw new Error('Subscription in invoice not found');

            await this.model.findOneAndUpdate(
                { stripeSubscriptionId },
                {
                    status: SubscriptionStatus.Unpaid,
                }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async subscriptionUpdated(
        dataObject: any,
        session: Stripe.Checkout.Session,
        stripe: Stripe
    ) {
        try {
            const subscriptionDetails = (await this.getSubscriptionDetails(
                stripe,
                dataObject.id
            )) as any;

            const status = toSubscriptionStatus(
                subscriptionDetails.status as StripeStatus
            );

            const priceSummary = Number(
                ((dataObject.plan.amount / 100) * dataObject.quantity).toFixed(
                    3
                )
            );

            const subscriptionType = await this.determineSubscriptionType(
                subscriptionDetails.plan.id
            );

            await this.model.findOneAndUpdate(
                { stripeSubscriptionId: dataObject.id },
                {
                    status,
                    type: subscriptionType,
                    price: priceSummary,
                    endDate: new Date(
                        subscriptionDetails.current_period_end * 1000
                    ),
                }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async subscriptionDeleted(dataObject: any) {
        try {
            const stripeSubscriptionId = dataObject['subscription'];
            if (!stripeSubscriptionId)
                throw new Error('Subscription in invoice not found');

            await this.model.findOneAndUpdate(
                { stripeSubscriptionId },
                {
                    status: SubscriptionStatus.Canceled,
                }
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeSubscriptionType(userId: string, type: SubscriptionType) {
        try {
            const subscription = await this.model.findOne({ userId });
            if (!subscription) {
                throw new Error('Subscription not found');
            }

            if (subscription.type === type) {
                throw new Error('Subscription already has this type');
            }

            await stripeService.changeSubscriptionType(
                subscription.stripeSubscriptionId,
                type
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteSubscription(userId: string) {
        try {
            await this.model.deleteOne({ userId });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async getSubscriptionDetails(
        stripe: Stripe,
        stripeSubscriptionId: any
    ) {
        return (await stripe.subscriptions.retrieve(
            stripeSubscriptionId as string
        )) as any;
    }

    private async createSubscriptionModel(
        stripe: Stripe,
        subscriptionId: string,
        userId: string
    ) {
        try {
            const subscriptionDetails = (await this.getSubscriptionDetails(
                stripe,
                subscriptionId
            )) as any;

            console.dir(subscriptionDetails, { depth: null });

            const subscriptionType = await this.determineSubscriptionType(
                subscriptionDetails.plan.id
            );

            console.log(subscriptionType);

            const newSubscriptionData: Subscription = {
                id: new mongoose.Types.ObjectId().toString(),
                userId,
                customerId: subscriptionDetails.customer as string,
                price: (subscriptionDetails?.plan?.amount || 0) / 100,
                stripeSubscriptionId: subscriptionDetails.id,
                startDate: new Date(subscriptionDetails.start_date * 1000),
                endDate: new Date(
                    subscriptionDetails.current_period_end * 1000
                ),
                status: SubscriptionStatus.Active,
                type: subscriptionType,
            };

            await this.model.create(newSubscriptionData);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async determineSubscriptionType(priceId: string) {
        if (priceId === config.STRIPE_STARTER_MONTHLY_PRICE_ID) {
            return SubscriptionType.Starter;
        } else if (priceId === config.STRIPE_PRO_MONTHLY_PRICE_ID) {
            return SubscriptionType.Pro;
        } else {
            throw new Error('Subscription type not found');
        }
    }
}
const subscriptionService = new SubscriptionService();
export default subscriptionService;
