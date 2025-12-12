import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { SummaryInterview } from "./getHypothesesValidation";

export const CREATE_HYPOTHESES_VALIDATION = gql`
  mutation CreateHypothesesValidation($projectHypothesisId: ID!) {
    createHypothesesValidation(projectHypothesisId: $projectHypothesisId) {
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

export interface CreateHypothesesValidationDto {
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

export interface CreateHypothesesValidationResponse {
  createHypothesesValidation: CreateHypothesesValidationDto;
}

export const createHypothesesValidation = async (projectHypothesisId: string) => {
  try {
    const result = await MUTATE<CreateHypothesesValidationResponse>({
      mutation: CREATE_HYPOTHESES_VALIDATION,
      variables: { projectHypothesisId },
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('[createHypothesesValidation] GraphQL error:', result.errors[0].message);
      throw new Error(result.errors[0].message || 'GraphQL error');
    }
    
    return result;
  } catch (error) {
    console.error('[createHypothesesValidation] Critical error:', error);
    throw error;
  }
};
