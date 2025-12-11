import axios from 'axios';
import { config } from '../../constants/config/env';
import { emailValidate } from '../../validation/userValidation';

export const validateEmail = async (email: string): Promise<boolean> => {
    try {
        email.toLowerCase();
        await emailValidate(email);

        // Bouncer проверка опциональна - если API ключ не установлен, пропускаем
        if (!config.BOUNCER_CHECK_API_KEY) {
            console.log('Bouncer API key not configured, skipping email validation');
            return true;
        }

        const response = await axios.get(
            `https://api.usebouncer.com/v1.1/email/verify?email=${email}`,
            {
                headers: {
                    'x-api-key': config.BOUNCER_CHECK_API_KEY,
                },
            }
        );

        if (response.data.status !== 'deliverable') return false;

        console.log(
            `Email ${email} have sending status - ${response.data.status}`
        );

        return true;
    } catch (err) {
        console.error('Error:', err);
        // throw err;
        return true;
    }
};
