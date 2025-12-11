import { elevateError } from '../../errors/elevateError';
import authService from '../../services/AuthService';
import promoCodeService from '../../services/promoCode/PromoCodeService';
import { IContext } from '../../types/IContext';

const promoCodeQueryResolver = {
    Query: {
        async getPromoCodeInfo(_: any, { code }: { code: string }) {
            try {
                return await promoCodeService.getPromoCodeInfo(code);
            } catch (error) {
                elevateError(error);
            }
        },

        async getAllPromoCodes(_: any, __: any, context: IContext) {
            try {
                // TODO: Добавить проверку на ADMIN роль
                // const userId = authService.getUserIdFromToken(context.token);
                // const user = await userService.getUserById(userId);
                // if (user.role !== UserRole.Admin) {
                //     throw new Error('Доступ запрещен');
                // }

                return await promoCodeService.getAllPromoCodes();
            } catch (error) {
                elevateError(error);
            }
        },
    },
};

export default promoCodeQueryResolver;

