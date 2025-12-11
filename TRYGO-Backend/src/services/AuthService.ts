import jwt from 'jsonwebtoken';
import { EXPIRE_TIME_TOKEN } from '../constants/others';
import { Payload, ResetCodePayload } from '../types/PayloadTypes';

class AuthService {
    generateTokenWithJwtSecret(
        id: string,
        jwtSecret: string,
    ): string {
        const payload: Payload = { id };

        return jwt.sign(payload, jwtSecret, {
            expiresIn: EXPIRE_TIME_TOKEN,
        });
    }

    generateToken(id: string): string {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not set. Please set it in Render Dashboard.');
        }

        const payload: Payload = { id };

        return jwt.sign(payload, jwtSecret, {
            expiresIn: EXPIRE_TIME_TOKEN,
        });
    }

    generateResetToken(email: string, resetCode: number): string {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not set. Please set it in Render Dashboard.');
        }

        const payload: ResetCodePayload = { email, resetCode };

        return jwt.sign(payload, jwtSecret, {
            expiresIn: EXPIRE_TIME_TOKEN,
        });
    }

    getDataFromResetToken(resetToken: string): ResetCodePayload {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not set. Please set it in Render Dashboard.');
        }
        try {
            const decoded = jwt.verify(
                resetToken,
                jwtSecret
            ) as ResetCodePayload;

            if (!decoded) throw new Error('Invalid resed token');

            return { email: decoded.email, resetCode: decoded.resetCode };
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    getDataFromToken(token: string) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET environment variable is not set. Please set it in Render Dashboard.');
        }
        try {
            const decoded = jwt.verify(
                token,
                jwtSecret
            ) as Payload;

            if (!decoded) throw new Error('Invalid token');

            return { id: decoded.id, name: decoded.name };
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    getUserIdFromToken(token: string) {
        const data = this.getDataFromToken(token);
        if (!data) throw new Error('Invalid token');

        return data.id;
    }

    verifyToken(token: string): boolean | null {
        try {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET environment variable is not set. Please set it in Render Dashboard.');
            }
            jwt.verify(token, jwtSecret);

            return true;
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    }

    checkToken(token: string): string {
        if (!token) throw new Error('Token is missing.');
        if (!this.verifyToken(token))
            throw new Error('Invalid or expired token.');
        return token;
    }
}

const authService = new AuthService();
export default authService;
