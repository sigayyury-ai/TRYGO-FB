import { OAuth2Client } from 'google-auth-library';
import { config } from '../constants/config/env';
const client = new OAuth2Client(
    config.GOOGLE_AUTH_CLIENT_ID,
    config.GOOGLE_AUTH_CLIENT_SECRET
);

class GoogleAuthService {
    async getEmailUserName(
        googleIdToken: string
    ): Promise<{ email: string; fullName: string }> {
        try {
            const ticket = await client.verifyIdToken({
                idToken: googleIdToken,
                audience: config.GOOGLE_AUTH_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) throw new Error('Invalid token');
            const payloadEmail = payload.email;
            if (!payloadEmail)
                throw new Error(
                    'Invalid configuration, user must have an email, pleas contact the support'
                );

            return {
                email: payloadEmail,
                fullName: payload.name || payloadEmail,
            };
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
}

const googleAuthService = new GoogleAuthService();
export default googleAuthService;
