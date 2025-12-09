import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";

export const CHANGE_HYPOTHESES_MARKET_RESEARCH = gql`
  mutation ChangeHypothesesMarketResearch(
    $input: ChangeHypothesesMarketResearchInput!
  ) {
    changeHypothesesMarketResearch(input: $input) {
      id
      userId
      projectHypothesisId
      threadId
      summary
    }
  }
`;

export interface ChangeHypothesesMarketResearchInput {
  id: string;
  summary: string;
}

export interface HypothesesMarketResearchDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  summary: string;
}

export interface ChangeProjectHypothesisResponse {
  changeHypothesesMarketResearch: HypothesesMarketResearchDto;
}

export const changeHypothesesMarketResearchMutation = (variables: {
  input: ChangeHypothesesMarketResearchInput;
}) => {
  return MUTATE<ChangeProjectHypothesisResponse>({
    mutation: CHANGE_HYPOTHESES_MARKET_RESEARCH,
    variables,
  });
};
