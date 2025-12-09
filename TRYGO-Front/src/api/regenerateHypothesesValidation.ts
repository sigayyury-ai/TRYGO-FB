import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { HypothesesValidationDto } from "./changeHypothesesValidation";

export const REGENERATE_HYPOTHESES_VALIDATION = gql`
  mutation RegenerateHypothesesValidation(
    $input: ProjectHypothesisIdPromptPartInput!
  ) {
    regenerateHypothesesValidation(input: $input) {
      id
      userId
      projectHypothesisId
      threadId
      validationChannels
      customerInterviewQuestions
      uploadedCustomerInterviews
      insightsCustomerInterviews
      summaryInterview {
        goals
        pains
        hypotheses
        toneOfVoice
      }
    }
  }
`;

export interface ProjectHypothesisIdPromptPartInput {
  projectHypothesisId: string | null;
  promptPart: string | null;
}

export interface RegenerateHypothesesValidationResponse {
  regenerateHypothesesValidation: HypothesesValidationDto;
}

export const regenerateHypothesesValidationMutation = (variables: {
  input: ProjectHypothesisIdPromptPartInput;
}) => {
  return MUTATE<RegenerateHypothesesValidationResponse>({
    mutation: REGENERATE_HYPOTHESES_VALIDATION,
    variables,
  });
};
