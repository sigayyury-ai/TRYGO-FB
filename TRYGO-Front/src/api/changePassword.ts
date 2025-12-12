import { gql, MutationFunctionOptions } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      user {
        id
        email
        role
        freeTrialDueTo
        isProjectGenerated
      }
      token
    }
  }
`;

export interface ChangePasswordResponseType {
  changePassword: {
    user: {
      id: string;
      email: string;
      role: 'ADMIN' | 'USER';
      freeTrialDueTo?: string;
      isProjectGenerated: boolean;
    };
    token: string;
  };
}

export interface ChangePasswordInputType {
  input: {
    newPassword: string;
    resetCode: number;
    email: string;
  };
}

export const changePasswordMutation = (
  variables: ChangePasswordInputType
  // options?: MutationFunctionOptions<
  //   ChangePasswordResponseType,
  //   ChangePasswordInputType
  // >
) =>
  MUTATE<ChangePasswordResponseType, ChangePasswordInputType>({
    mutation: CHANGE_PASSWORD,
    variables,
    // ...options,
  });
