import { elevateError } from '../../errors/elevateError';
import authService from '../../services/AuthService';
import promoCodeService from '../../services/promoCode/PromoCodeService';
import { IContext } from '../../types/IContext';
import { SubscriptionType } from '../../generated/graphql';

const promoCodeMutationResolver = {
    Mutation: {
        async activatePromoCode(
            _: any,
            { code }: { code: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                return await promoCodeService.activatePromoCode(code, userId);
            } catch (error) {
                elevateError(error);
            }
        },

        async createPromoCode(
            _: any,
            {
                code,
                subscriptionType,
                durationMonths,
                maxUses,
                expiresAt,
                description,
            }: {
                code: string;
                subscriptionType: SubscriptionType;
                durationMonths?: number;
                maxUses?: number;
                expiresAt?: Date;
                description?: string;
            },
            context: IContext
        ) {
            try {
                // TODO: Добавить проверку на ADMIN роль
                // const userId = authService.getUserIdFromToken(context.token);
                // const user = await userService.getUserById(userId);
                // if (user.role !== UserRole.Admin) {
                //     throw new Error('Доступ запрещен');
                // }

                const userId = authService.getUserIdFromToken(context.token);

                return await promoCodeService.createPromoCode({
                    code,
                    subscriptionType,
                    durationMonths,
                    maxUses,
                    expiresAt,
                    description,
                    createdBy: userId,
                });
            } catch (error) {
                elevateError(error);
            }
        },
    },
};

export default promoCodeMutationResolver;

