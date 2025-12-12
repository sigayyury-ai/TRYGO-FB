import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";

export const CREATE_HYPOTHESES_MARKET_RESEARCH = gql`
  mutation CreateHypothesesMarketResearch($projectHypothesisId: ID!) {
    createHypothesesMarketResearch(projectHypothesisId: $projectHypothesisId) {
      id
      userId
      projectHypothesisId
      threadId
      summary
    }
  }
`;

export interface CreateHypothesesMarketResearchDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  summary: string;
}

export interface ChangeProjectHypothesisResponse {
  createHypothesesMarketResearch: CreateHypothesesMarketResearchDto;
}

export const createHypothesesMarketResearch = async (projectHypothesisId: string) => {
  console.log('[createHypothesesMarketResearch API] Calling mutation with:', { projectHypothesisId });
  
  try {
    const result = await MUTATE<ChangeProjectHypothesisResponse>({
      mutation: CREATE_HYPOTHESES_MARKET_RESEARCH,
      variables: { projectHypothesisId },
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('[createHypothesesMarketResearch API] GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message || 'GraphQL error');
    }
    
    console.log('[createHypothesesMarketResearch API] Mutation successful:', result.data);
    return result;
  } catch (error) {
    console.error('[createHypothesesMarketResearch API] Error:', error);
    throw error;
  }
};
