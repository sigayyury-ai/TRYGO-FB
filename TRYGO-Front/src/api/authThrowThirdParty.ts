import { gql, MutationFunctionOptions } from '@apollo/client';
import { MUTATE } from '../config/apollo/client';

export const AUTH_THROW_THIRD_PARTY = gql`
  mutation AuthThrowThirdParty($input: AuthThrowThirdPartyInput!) {
    authThrowThirdParty(input: $input) {
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

export interface AuthThrowThirdPartyResponseType {
  authThrowThirdParty: {
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

export interface AuthThrowThirdPartyInput {
  googleIdToken?: string;
  appleIdToken?: string;
}

export interface AuthThrowThirdPartyInputType {
  input: AuthThrowThirdPartyInput;
}

export const authThrowThirdPartyMutation = (
  variables: AuthThrowThirdPartyInputType,
  options?: MutationFunctionOptions<AuthThrowThirdPartyResponseType, AuthThrowThirdPartyInputType>
) => {
  return MUTATE<AuthThrowThirdPartyResponseType, AuthThrowThirdPartyInputType>({
    mutation: AUTH_THROW_THIRD_PARTY,
    variables,
    ...options,
  });
};

