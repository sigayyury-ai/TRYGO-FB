import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";

export const CREATE_HYPOTHESES_PACKING = gql`
  mutation CreateHypothesesPacking($projectHypothesisId: ID!) {
    createHypothesesPacking(projectHypothesisId: $projectHypothesisId) {
      id
      userId
      projectHypothesisId
      threadId
      summary
    }
  }
`;

export interface CreateHypothesesPackingDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  summary: string;
}

export interface ChangeHypothesisPackingResponse {
  createHypothesesPacking: CreateHypothesesPackingDto;
}

export const createHypothesesPackingMutation = (
  projectHypothesisId: string
) => {
  return MUTATE<ChangeHypothesisPackingResponse>({
    mutation: CREATE_HYPOTHESES_PACKING,
    variables: { projectHypothesisId },
  });
};
