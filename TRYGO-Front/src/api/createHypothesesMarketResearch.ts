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

export const createHypothesesMarketResearch = (projectHypothesisId: string) => {
  return MUTATE<ChangeProjectHypothesisResponse>({
    mutation: CREATE_HYPOTHESES_MARKET_RESEARCH,
    variables: { projectHypothesisId },
  });
};
