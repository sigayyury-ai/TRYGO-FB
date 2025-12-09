import { elevateError } from '../../errors/elevateError';
import authService from '../../services/AuthService';
import subscriptionService from '../../services/subscription/SubscriptionService';
import { IContext } from '../../types/IContext';

const subscriptionQueryResolver = {
    Query: {
        async getSubscription(_: any, __: any, context: IContext) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                return await subscriptionService.getSubscription(userId);
            } catch (error) {
                elevateError(error);
            }
        },

        async getSubscriptionStripeSession(_: any, __: any, context: IContext) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                return await subscriptionService.getSubscriptionStripeSessionUrl(
                    userId
                );
            } catch (error) {
                elevateError(error);
            }
        },
    },
};

export default subscriptionQueryResolver;
