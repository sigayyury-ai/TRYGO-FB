import { gql, MutationFunctionOptions } from '@apollo/client';
import { MUTATE } from '../config/apollo/client';
import { ProjectStartType } from '../store/useSocketStore';

export const SUBMIT_EMBEDDED_ONBOARDING = gql`
  mutation SubmitEmbeddedOnboarding($input: EmbeddedOnboardingInput!) {
    submitEmbeddedOnboarding(input: $input) {
      success
      userId
      projectId
      isNewAccount
      passwordSent
      errorCode
      errorMessage
      subscriptionLimitReached
    }
  }
`;

export interface EmbeddedOnboardingResponseType {
  submitEmbeddedOnboarding: {
    success: boolean;
    userId?: string;
    projectId?: string;
    isNewAccount: boolean;
    passwordSent: boolean;
    errorCode?: string;
    errorMessage?: string;
    subscriptionLimitReached?: boolean;
  };
}

export interface EmbeddedOnboardingInputType {
  email: string;
  startType: ProjectStartType;
  info: string;
  url?: string;
  embedSource?: string;
}

export interface EmbeddedOnboardingMutationInputType {
  input: EmbeddedOnboardingInputType;
}

export const submitEmbeddedOnboardingMutation = (
  variables: EmbeddedOnboardingMutationInputType,
  options?: MutationFunctionOptions<EmbeddedOnboardingResponseType, EmbeddedOnboardingMutationInputType>
) => {
  return MUTATE<EmbeddedOnboardingResponseType, EmbeddedOnboardingMutationInputType>({
    mutation: SUBMIT_EMBEDDED_ONBOARDING,
    variables,
    ...options,
  });
};
