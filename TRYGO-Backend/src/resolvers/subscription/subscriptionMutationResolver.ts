import authService from '../../services/AuthService';
import stripeService from '../../services/subscription/StripeService';
import subscriptionService from '../../services/subscription/SubscriptionService';
import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import { SubscriptionType } from '../../generated/graphql';
import userService from '../../services/UserService';

const subscriptionMutationResolver = {
    Mutation: {
        async createSubscriptionCheckout(
            _: unknown,
            { type }: { type: SubscriptionType },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                const user = await userService.getUserById(userId);
                await subscriptionService.checkIfSubscriptionExists(userId);

                const stripeSession =
                    await stripeService.createStripeSubscriptionCheckout(
                        userId,
                        user.email,
                        type
                    );
                if (!stripeSession) {
                    throw new Error(
                        `Failed to create stripe checkout session for user with ID ${userId}`
                    );
                }

                return stripeSession.url;
            } catch (error) {
                elevateError(error);
            }
        },

        async changeSubscription(
            _: unknown,
            { type }: { type: SubscriptionType },
            context: IContext
        ) {
            try {
                await subscriptionService.changeSubscriptionType(context.userId, type);
                return 'Subscription changed successfully';
            } catch (error) {
                elevateError(error);
            }
        },
    },
};

export default subscriptionMutationResolver;
