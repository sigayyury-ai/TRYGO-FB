import { gql } from "@apollo/client";
import { QUERY } from "@/config/apollo/client";

export const GET_HYPOTHESES_VALIDATION = gql`
  query GetHypothesesValidation($projectHypothesisId: ID!) {
    getHypothesesValidation(projectHypothesisId: $projectHypothesisId) {
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

export interface HypothesesValidation {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  validationChannels: Array<string>;
  customerInterviewQuestions: Array<string>;
  uploadedCustomerInterviews: string | null;
  insightsCustomerInterviews: string | null;
  summaryInterview: SummaryInterview;
}

export interface SummaryInterview {
  goals: Array<string>;
  pains: Array<string>;
  hypotheses: Array<string>;
  toneOfVoice: string;
}

export interface GetHypothesesValidationResponse {
  getHypothesesValidation: HypothesesValidation;
}

export const getHypothesesValidationQuery = (projectHypothesisId: string) => {
  return QUERY<GetHypothesesValidationResponse>({
    query: GET_HYPOTHESES_VALIDATION,
    variables: { projectHypothesisId },
    fetchPolicy: "network-only",
  });
};
