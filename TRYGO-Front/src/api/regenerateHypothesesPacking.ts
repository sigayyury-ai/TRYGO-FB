import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';
import { HypothesesPackingDto } from './changeHypothesesPacking';

export const REGENERATE_HYPOTHESES_PACKING = gql`
  mutation RegenerateHypothesesPacking($input: ProjectHypothesisIdPromptPartInput!) {
    regenerateHypothesesPacking(input: $input) {
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

export interface RegenerateHypothesesPackingResponse {
  regenerateHypothesesPacking: HypothesesPackingDto;
}

export const regenerateHypothesesPackingMutation = (variables: {
  input: ProjectHypothesisIdPromptPartInput;
}) => {
  return MUTATE<RegenerateHypothesesPackingResponse>({
    mutation: REGENERATE_HYPOTHESES_PACKING,
    variables,
  });
};
