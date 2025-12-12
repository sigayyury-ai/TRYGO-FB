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

export const createHypothesesPackingMutation = async (
  projectHypothesisId: string
) => {
  try {
    const result = await MUTATE<ChangeHypothesisPackingResponse>({
      mutation: CREATE_HYPOTHESES_PACKING,
      variables: { projectHypothesisId },
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('[createHypothesesPacking] GraphQL error:', result.errors[0].message);
      throw new Error(result.errors[0].message || 'GraphQL error');
    }
    
    return result;
  } catch (error) {
    console.error('[createHypothesesPacking] Critical error:', error);
    throw error;
  }
};
