import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";

export const UPLOAD_HYPOTHESES_VALIDATION_JTBD_INTERVIEW = gql`
  mutation UploadHypothesesValidationJtbdInterview(
    $input: UploadHypothesesValidationJtbdInterviewInput!
  ) {
    uploadHypothesesValidationJtbdInterview(input: $input) {
      id
      userId
      projectHypothesisId
      threadId
      validationChannels
      customerInterviewQuestions
      jtbdInterviewQuestions
      uploadedCustomerInterviews
      uploadedJtbdInterviews
      insightsCustomerInterviews
      insightsJtbdInterviews
      finalOffers
    }
  }
`;

export interface UploadHypothesesValidationJtbdInterview {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  validationChannels: Array<string>;
  customerInterviewQuestions: Array<string>;
  jtbdInterviewQuestions: Array<string>;
  uploadedCustomerInterviews: string | null;
  uploadedJtbdInterviews: string | null;
  insightsCustomerInterviews: string | null;
  insightsJtbdInterviews: string | null;
  finalOffers: Array<string> | null;
}

export interface UploadHypothesesValidationJtbdInterviewInput {
  id: string;
  jtbdInterview: string;
}

export interface UploadHypothesesValidationJtbdInterviewResponse {
  uploadHypothesesValidationJtbdInterview: UploadHypothesesValidationJtbdInterview;
}

export const UploadValidationJtbdInterviewMutation = (variables: {
  input: UploadHypothesesValidationJtbdInterviewInput;
}) => {
  return MUTATE<UploadHypothesesValidationJtbdInterviewResponse>({
    mutation: UPLOAD_HYPOTHESES_VALIDATION_JTBD_INTERVIEW,
    variables,
  });
};
