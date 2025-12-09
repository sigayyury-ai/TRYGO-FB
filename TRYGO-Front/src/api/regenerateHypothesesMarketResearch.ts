import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';
import { HypothesesMarketResearchDto } from './changeHypothesesMarketResearch';

export const REGENERATE_HYPOTHESES_MARKET_RESEARCH = gql`
  mutation RegenerateHypothesesMarketResearch($input: ProjectHypothesisIdPromptPartInput!) {
    regenerateHypothesesMarketResearch(input: $input) {
      id
      userId
      projectHypothesisId
      threadId
      summary
    }
  }
`;

export interface ProjectHypothesisIdPromptPartInput {
  projectHypothesisId: string | null;
  promptPart: string | null;
}

export interface RegenerateHypothesesMarketResearchResponse {
  regenerateHypothesesMarketResearch: HypothesesMarketResearchDto;
}

export const regenerateHypothesesMarketResearchMutation = (variables: {
  input: ProjectHypothesisIdPromptPartInput;
}) => {
  return MUTATE<RegenerateHypothesesMarketResearchResponse>({
    mutation: REGENERATE_HYPOTHESES_MARKET_RESEARCH,
    variables,
  });
};
