import { gql, MutationFunctionOptions } from '@apollo/client';
import { MUTATE } from '../config/apollo/client';

export const LOGIN = gql`
  mutation Login($input: LoginInput) {
    login(input: $input) {
      user {
        id
        email
        role
        freeTrialDueTo
      }
      token
    }
  }
`;

export interface LoginResponseType {
  login: {
    user: {
      id: string;
      email: string;
      role: 'ADMIN' | 'USER';
      freeTrialDueTo?: string;
    };
    token: string;
  };
}

export interface LoginType {
  email: string;
  password: string;
}

export interface LoginInputType {
  input: LoginType;
}

export const loginMutation = (
  variables: LoginInputType,
  options?: MutationFunctionOptions<LoginResponseType, LoginInputType>
) => {
  return MUTATE<LoginResponseType, LoginInputType>({
    mutation: LOGIN,
    variables,
    ...options,
  });
};
