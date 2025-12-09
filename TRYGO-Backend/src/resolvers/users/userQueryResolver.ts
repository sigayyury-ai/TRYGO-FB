import authService from '../../services/AuthService';
import userService from '../../services/UserService';
import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import { getTextContentFromWebsite } from '../../utils/getTextContentFromWebsite';
import migrationService from '../../migrations';
import { sendDailyStatistic } from '../../utils/statistic/sendDailyStatistic';

const userQueryResolver = {
    Query: {
        async getUserByToken(_: never, __: unknown, context: IContext) {
            try {
                const token = authService.checkToken(context.token);

                return await userService.getUserByToken(token);
            } catch (err) {
                elevateError(err);
            }
        },

        async test(_: never, __: unknown, context: IContext) {
            try {
            } catch (error) {
                elevateError(error);
            }
        },
    },
};

export default userQueryResolver;
