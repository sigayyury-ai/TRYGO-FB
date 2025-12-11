import { IUser } from '../../types/IUser';
import { AuthResponse } from '../../generated/graphql';

export const toAuthResponse = (user: IUser, token: string): AuthResponse => {
    return { user: { id: user.id, ...user.toObject() }, token };
};
