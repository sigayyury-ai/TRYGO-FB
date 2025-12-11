import { gql } from "@apollo/client";
import { QUERY } from "@/config/apollo/client";

export const GET_HYPOTHESES_MARKET_RESEARCH = gql`
  query GetHypothesesMarketResearch($projectHypothesisId: ID!) {
    getHypothesesMarketResearch(projectHypothesisId: $projectHypothesisId) {
      id
      userId
      projectHypothesisId
      threadId
      summary
    }
  }
`;

export interface HypothesesMarketResearch {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  summary: string;
}

export interface GetHypothesesMarketResearchResponse {
  getHypothesesMarketResearch: HypothesesMarketResearch;
}

export const getHypothesesMarketResearchQuery = (projectHypothesisId: string) => {
  return QUERY<GetHypothesesMarketResearchResponse>({
    query: GET_HYPOTHESES_MARKET_RESEARCH,
    variables: { projectHypothesisId },
    fetchPolicy: "network-only",
  });
};
