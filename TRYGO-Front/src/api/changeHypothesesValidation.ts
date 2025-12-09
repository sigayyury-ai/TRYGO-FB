import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { SummaryInterview } from "./getHypothesesValidation";

export const CHANGE_HYPOTHESES_VALIDATION = gql`
  mutation ChangeHypothesesValidation(
    $input: ChangeHypothesesValidationInput!
  ) {
    changeHypothesesValidation(input: $input) {
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
        hypotheses
        pains
        toneOfVoice
      }
    }
  }
`;

export interface ChangeHypothesesValidationInput {
  id: string;
  customerInterviewQuestions?: Array<string> | null;
  insightsCustomerInterviews?: string | null;
  uploadedCustomerInterviews?: string | null;
  summaryInterview?: SummaryInterview | null
}

export interface HypothesesValidationDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  validationChannels: Array<string>;
  customerInterviewQuestions: Array<string>;
  uploadedCustomerInterviews: string | null;
  insightsCustomerInterviews: string | null;
  summaryInterview: SummaryInterview
}

export interface ChangeHypothesisValidationResponse {
  changeHypothesesValidation: HypothesesValidationDto;
}

export const changeHypothesesValidationMutation = (variables: {
  input: ChangeHypothesesValidationInput;
}) => {
  return MUTATE<ChangeHypothesisValidationResponse>({
    mutation: CHANGE_HYPOTHESES_VALIDATION,
    variables,
  });
};
