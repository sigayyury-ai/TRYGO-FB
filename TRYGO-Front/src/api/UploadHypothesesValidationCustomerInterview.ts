import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { SummaryInterview } from "./getHypothesesValidation";

export const UPLOAD_HYPOTHESES_VALIDATION_CUSTOMER_INTERVIEW = gql`
  mutation UploadHypothesesValidationCustomerInterview(
    $input: UploadHypothesesValidationCustomerInterviewInput!
  ) {
    uploadHypothesesValidationCustomerInterview(input: $input) {
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

export interface UploadHypothesesValidationCustomerInterview {
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

export interface UploadHypothesesValidationCustomerInterviewInput {
  id: string;
  customerInterview: string;
}

export interface UploadHypothesesValidationCustomerInterviewResponse {
  uploadHypothesesValidationCustomerInterview: UploadHypothesesValidationCustomerInterview;
}

export const UploadValidationCustomerInterviewMutation = (variables: {
  input: UploadHypothesesValidationCustomerInterviewInput;
}) => {
  return MUTATE<UploadHypothesesValidationCustomerInterviewResponse>({
    mutation: UPLOAD_HYPOTHESES_VALIDATION_CUSTOMER_INTERVIEW,
    variables,
  });
};
