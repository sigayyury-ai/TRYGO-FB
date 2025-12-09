import { PASSWORD_RESET_CODE_LENGTH } from '../constants/others';
import { errorTextes } from '../constants/errorTextes';
import UserModel from '../models/UserModel';
import authService from './AuthService';
import {
    comparePasswordHash,
    createPasswordHash,
    generateResetCode,
    isEmail,
    sendPasswordCodeEmail,
} from '../utils';
import { elevateError } from '../errors/elevateError';
import { IUser } from '../types/IUser';
import {
    AuthResponse,
    ChangePasswordInput,
    LoginInput,
    RegisterInput,
    UserRole,
} from '../generated/graphql';
import googleAuthService from './GoogleAuthService';
import { validateEmail } from '../utils/email/validateEmail';
import { toAuthResponse } from '../utils/user/toAuthResponse';
import { config } from '../constants/config/env';

class UserService {
    private model: typeof UserModel = UserModel;

    async getQuantityOfNewUsers(from: Date, to: Date): Promise<number> {
        try {
            return await this.model.countDocuments({
                createdAt: { $gte: from, $lte: to },
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getUsersByIds(ids: string[]) {
        return await this.model.find({ _id: { $in: ids } });
    }

    async getUserByToken(token: string) {
        try {
            const userId = authService.getUserIdFromToken(token);
            const user = await this.model.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }
            const newToken = authService.generateToken(user.id);

            return { user, token: newToken };
        } catch (err) {
            elevateError(err);
        }
    }

    async getUserById(userId: string): Promise<IUser> {
        try {
            const user = await this.model.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async getUserByEmailDefault(email: string): Promise<IUser | null> {
        try {
            return await this.model.findOne({ email });
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async getUserCount(): Promise<number> {
        try {
            return await this.model.countDocuments();
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async getUserByEmail(email: string): Promise<IUser> {
        try {
            const user = await this.model.findOne({ email });
            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async register(
        input: RegisterInput,
        role: UserRole
    ): Promise<AuthResponse> {
        try {
            const user = await this.getUserByEmailDefault(input.email);
            if (user) {
                throw new Error('User with this email already exists');
            }
            const passwordHash = await createPasswordHash(input.password);

            const sevenDaysFromNow = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            );

            const newUser = await this.model.create({
                email: input.email,
                passwordHash,
                role,
                freeTrialDueTo: sevenDaysFromNow,
            });
            const token = authService.generateToken(newUser.id);

            return toAuthResponse(newUser, token);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async authThrowThirdParty(
        googleIdToken: string,
        role: UserRole
    ): Promise<AuthResponse> {
        try {
            const { email } =
                await googleAuthService.getEmailUserName(googleIdToken);
            const user = await this.findUserByEmail(email);
            if (user) {
                const token = authService.generateToken(user.id);

                return toAuthResponse(user, token);
            }

            const sevenDaysFromNow = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            );

            const newUser = await this.model.create({
                email: email,
                role,
                freeTrialDueTo: sevenDaysFromNow,
            });
            const token = authService.generateToken(newUser.id);

            return toAuthResponse(newUser, token);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async login(input: LoginInput): Promise<AuthResponse> {
        try {
            const user = await this.findUserByEmail(input.email);

            if (!user) {
                throw new Error(errorTextes.emailPasswordIncorrect);
            }

            return this.authenticate(user, input);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getNumberNewUsersByDays(days: number) {
        try {
            const ONE_DAY = 24 * 60 * 60 * 1000;
            const startDate = new Date(Date.now() - days * ONE_DAY);
            const endDate = new Date();
            const users = await this.model.find({
                createdAt: {
                    $gte: startDate,
                    $lt: new Date(endDate.setHours(23, 59, 59, 999)),
                },
            });
            return users.length;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getNumberRetainedUsersByDays(daysAgo: number) {
        try {
            const registrationDate = new Date();
            registrationDate.setDate(
                registrationDate.getDate() - (daysAgo + 1)
            );

            const retentionCheckDate = new Date();
            retentionCheckDate.setDate(retentionCheckDate.getDate() - 1);

            return await UserModel.countDocuments({
                createdAt: {
                    $gte: new Date(registrationDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(registrationDate.setHours(23, 59, 59, 999)),
                },
                activeDates: {
                    $elemMatch: {
                        $gte: new Date(retentionCheckDate.setHours(0, 0, 0, 0)),
                        $lt: new Date(
                            retentionCheckDate.setHours(23, 59, 59, 999)
                        ),
                    },
                },
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getActiveUsersByDays(daysAgo: number) {
        try {
            const dateStart = new Date();
            dateStart.setUTCDate(dateStart.getUTCDate() - daysAgo);
            dateStart.setUTCHours(0, 0, 0, 0);

            const dateEnd = new Date();

            const uniqueUserIds = await this.model.distinct('userId', {
                completedAt: {
                    $gte: dateStart,
                    $lte: dateEnd,
                },
            });

            return uniqueUserIds.length;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async authenticate(user: IUser, input: LoginInput): Promise<AuthResponse> {
        try {
            await this.checkUserRegisteredWithThirdParty(user.passwordHash);

            const isPasswordValid = await comparePasswordHash(
                input.password,
                user?.passwordHash as string
            );
            if (!isPasswordValid) {
                throw new Error(errorTextes.emailPasswordIncorrect);
            }

            const token = authService.generateToken(user.id);

            return toAuthResponse(user, token);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async sendPasswordResetCode(email: string) {
        try {
            const user = await this.findUserByEmail(email);

            if (!user) {
                throw new Error('User not found');
            }

            const { resetCode, expireAt } = generateResetCode(
                PASSWORD_RESET_CODE_LENGTH
            );

            if (!user.resetPassword) {
                user.resetPassword = {};
            }

            user.resetPassword.resetCode = resetCode;
            user.resetPassword.expire = expireAt.toString();

            const resetToken = authService.generateResetToken(email, resetCode);

            await user.save();

            await sendPasswordCodeEmail(resetToken, user.email);

            return 'Password reset code has been sent to your email';
        } catch (err) {
            elevateError(err);
        }
    }

    async changePassword(data: ChangePasswordInput) {
        try {
            const user = await this.findUserByEmail(data.email);

            if (!user) {
                throw new Error('User not found.');
            }

            if (config.isProduction) {
                if (user.resetPassword?.resetCode !== data.resetCode) {
                    throw new Error('Invalid reset code.');
                }

                const expirationDate = new Date(user.resetPassword.expire);

                if (isNaN(expirationDate.getTime())) {
                    throw new Error('Invalid expiration date.');
                }

                if (new Date() > expirationDate) {
                    throw new Error('Reset code has expired.');
                }
            }

            user.passwordHash = await createPasswordHash(data.newPassword);
            user.resetPassword = undefined;
            await user.save();

            const token = authService.generateToken(user.id);

            return { user, token };
        } catch (err) {
            elevateError(err);
        }
    }

    async findUserByEmail(email: string) {
        if (await isEmail(email)) {
            return await this.model.findOne({ email });
        }
    }

    async validateUserEmail(email: string): Promise<void> {
        try {
            const actualEmail = await validateEmail(email);
            if (!actualEmail)
                throw new Error('You have entered an invalid email address');
        } catch (error) {
            elevateError(error);
        }
    }

    async updateTimeZoneOffset(userId: string, offset: number): Promise<void> {
        try {
            const user = await this.model.findByIdAndUpdate(userId, {
                timeZoneOffset: offset,
            });
            if (!user) {
                throw new Error('User not found');
            }
        } catch (error) {
            elevateError(error);
        }
    }

    async updateTimeZoneOffsetByToken(
        token: string,
        offset: number
    ): Promise<void> {
        try {
            const userId = authService.getUserIdFromToken(token);
            await this.updateTimeZoneOffset(userId, offset);
        } catch (error) {
            elevateError(error);
        }
    }

    async changeUser(userId: string, data: Partial<IUser>): Promise<void> {
        try {
            await this.model.findByIdAndUpdate(userId, data);
        } catch (error) {
            elevateError(error);
        }
    }

    private async checkExistingUser(email: string): Promise<void> {
        try {
            const user = await this.model.findOne({ email: email });
            if (user) {
                await this.checkUserRegisteredWithThirdParty(user.passwordHash);
                throw new Error('User with this email already exists');
            }
        } catch (error) {
            elevateError(error);
        }
    }

    private async checkUserRegisteredWithThirdParty(
        passwordHash: any
    ): Promise<void> {
        try {
            if (passwordHash == undefined || passwordHash == null) {
                throw new Error(errorTextes.registeredThrowThirdParty);
            }
        } catch (error) {
            elevateError(error);
        }
    }
}
const userService = new UserService();
export default userService;
