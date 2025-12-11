import userService from '../../services/UserService';
import { elevateError } from '../../errors/elevateError';
import {
    AuthThrowThirdPartyInput,
    ChangeEmailInput,
    ChangePasswordInput,
    GenerateTokenThrowEmailInput,
    LoginInput,
    RegisterInput,
    UserRole,
} from '../../generated/graphql';
import authService from '../../services/AuthService';
import { IContext } from '../../types/IContext';

const userMutationResolvers = {
    Mutation: {
        async register(_: unknown, { input }: { input: RegisterInput }) {
            try {
                await userService.validateUserEmail(input.email);

                const response = await userService.register(
                    input,
                    UserRole.User
                );
                return response;
            } catch (err) {
                elevateError(err);
            }
        },

        async authThrowThirdParty(
            _: unknown,
            { input }: { input: AuthThrowThirdPartyInput }
        ) {
            try {
                const response = await userService.authThrowThirdParty(
                    input.googleIdToken,
                    UserRole.User
                );

                return response;
            } catch (err) {
                elevateError(err);
            }
        },

        async login(_: unknown, { input }: { input: LoginInput }) {
            try {
                return await userService.login(input);
            } catch (err) {
                elevateError(err);
            }
        },

        async forgotPassword(_: unknown, { email }: { email: string }) {
            try {
                return await userService.sendPasswordResetCode(email);
            } catch (err) {
                elevateError(err);
            }
        },

        async changePassword(
            _: unknown,
            { input }: { input: ChangePasswordInput }
        ) {
            try {
                return await userService.changePassword(input);
            } catch (err) {
                elevateError(err);
            }
        },

        async generateTokenThrowEmail(
            _: unknown,
            { input }: { input: GenerateTokenThrowEmailInput }
        ) {
            try {
                const user = await userService.getUserByEmail(input.email);
                if (!user) throw new Error('User by this email not found');

                return authService.generateTokenWithJwtSecret(
                    user.id,
                    input.jwtSecret,
                );
            } catch (err) {
                elevateError(err);
            }
        },

        async changeEmail(
            _: unknown,
            { input }: { input: ChangeEmailInput },
            context: IContext
        ) {
            try {
                // Проверяем, что пользователь авторизован
                const token = authService.checkToken(context.token);
                const userId = authService.getUserIdFromToken(token);

                // Выполняем смену email
                return await userService.changeEmail(userId, input.newEmail);
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default userMutationResolvers;
