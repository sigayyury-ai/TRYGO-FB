import { MailtrapClient } from 'mailtrap';
import { config } from '../../constants/config/env';
import { mailTrapTemplates } from '../../constants/mailTrapTemplates';
import { validateEmail } from './validateEmail';

const client = new MailtrapClient({ token: config.MAIL_TRAP.apiKey! });

const sender = {
    name: config.MAIL_TRAP.fromName!,
    email: config.MAIL_TRAP.emailAddress!,
};

export const sendEmailWithTemplateNoSubject = async (
    email: string,
    template_uuid: string,
    template_variables?: any
) => {
    const message = {
        from: sender,
        to: [{ email }],
        template_uuid,
        template_variables,
    };

    const isValid = await validateEmail(email);

    if (!isValid) {
        throw new Error('Email is not valid');
    }
    await client.send(message);

    return `Email to ${email} has been sent successfully.`;
};

const sendPasswordCodeEmail = async (resetToken: string, email: string) => {
    try {
        return await sendEmailWithTemplateNoSubject(
            email,
            mailTrapTemplates.passwordReset,
            {
                resetToken,
            }
        );
    } catch (err) {
        console.error(err);
    }
};

export { sendPasswordCodeEmail };
