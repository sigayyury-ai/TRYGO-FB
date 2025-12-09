import { gql, MutationFunctionOptions } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';

export const FORGOT_PASSWORD = gql`
  mutation ForgotPassword($email: String!) {
    forgotPassword(email: $email)
  }
`;

export interface ForgotPasswordResponseType {
  forgotPassword: string;
}

export interface ForgotPasswordInputType {
  email: string;
}

export const forgotPasswordMutation = (
  variables: ForgotPasswordInputType,
//   options?: MutationFunctionOptions<
//     ForgotPasswordResponseType,
//     ForgotPasswordInputType
//   >
) =>
  MUTATE<ForgotPasswordResponseType, ForgotPasswordInputType>({
    mutation: FORGOT_PASSWORD,
    variables,
    // ...options,
  });
