import * as yup from 'yup';

export const isEmail = async (login: string): Promise<boolean> => {
    const emailSchema = yup.string().email();
    try {
        await emailSchema.validate(login);
        return true;
    } catch (err) {
        return false;
    }
};
