import { gql } from "@apollo/client";
import { QUERY } from "@/config/apollo/client";

export const GET_HYPOTHESES_PACKING = gql`
  query GetHypothesesPacking($projectHypothesisId: ID!) {
    getHypothesesPacking(projectHypothesisId: $projectHypothesisId) {
      id
      userId
      projectHypothesisId
      threadId
      summary
    }
  }
`;

export interface HypothesesPacking {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  summary: string;
}

export interface GetHypothesesPackingResponse {
  getHypothesesPacking: HypothesesPacking;
}

export const getHypothesesPackingQuery = (projectHypothesisId: string) => {
  return QUERY<GetHypothesesPackingResponse>({
    query: GET_HYPOTHESES_PACKING,
    variables: { projectHypothesisId },
    fetchPolicy: "network-only",
  });
};
