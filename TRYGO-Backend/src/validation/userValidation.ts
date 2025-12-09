import * as yup from 'yup';
import { GraphQLError } from 'graphql/error';

const emailSchema = yup.object().shape({
    email: yup.string().required('Email is required'),
});

export const emailValidate = async (email: string): Promise<void> => {
    try {
        await emailSchema.validate({ email });
    } catch (err) {
        throw new GraphQLError((err as yup.ValidationError).message);
    }
};
