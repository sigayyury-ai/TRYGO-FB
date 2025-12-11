import { gql, MutationFunctionOptions } from '@apollo/client';
import { MUTATE } from '../config/apollo/client';

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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

export interface RegisterResponseType {
  register: {
    user: {
      id: string;
      email: string;
      role: 'ADMIN' | 'USER';
      freeTrialDueTo?: string;
    };
    token: string;
  };
}

export interface RegisterType {
  email: string;
  password: string;
}

export interface RegisterInputType {
  input: RegisterType;
}

export const registerMutation = (
  variables: RegisterInputType,
  options?: MutationFunctionOptions<RegisterResponseType, RegisterInputType>
) => {
  return MUTATE<RegisterResponseType, RegisterInputType>({
    mutation: REGISTER,
    variables,
    ...options,
  });
};
