import { sendEmailWithTemplateNoSubject } from './mailTrapUtils';
import { mailTrapTemplates } from '../../constants/mailTrapTemplates';
import { config } from '../../constants/config/env';

/**
 * Sends password email to user who completed embedded onboarding
 * 
 * IMPORTANT: Before using this function, create an email template in Mailtrap dashboard
 * with the following variables: {{email}}, {{password}}, {{loginUrl}}
 * Then update the UUID in mailTrapTemplates.embeddedOnboardingPassword
 * 
 * @param email - User's email address
 * @param password - Generated password (plain text)
 * @returns Promise resolving to success message
 */
export const sendEmbeddedOnboardingPasswordEmail = async (
    email: string,
    password: string
): Promise<string> => {
    try {
        if (!mailTrapTemplates.embeddedOnboardingPassword) {
            throw new Error('Embedded onboarding password email template UUID not configured. Please create template in Mailtrap and update mailTrapTemplates.embeddedOnboardingPassword');
        }

        const loginUrl = config.FRONTEND_URL 
            ? `${config.FRONTEND_URL}/auth` 
            : 'https://trygo.app/auth';

        return await sendEmailWithTemplateNoSubject(
            email,
            mailTrapTemplates.embeddedOnboardingPassword,
            {
                email,
                password,
                loginUrl,
            }
        );
    } catch (err) {
        console.error('Error sending embedded onboarding password email:', err);
        throw err;
    }
};
