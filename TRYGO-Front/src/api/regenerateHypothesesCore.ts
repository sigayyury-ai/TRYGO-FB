import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';
import { HypothesesCoreDto } from './getHypothesesCore';

export const REGENERATE_HYPOTHESES_CORE = gql`
  mutation RegenerateHypothesesCore($input: ProjectHypothesisIdPromptPartInput!) {
    regenerateHypothesesCore(input: $input) {
      id
      userId
      projectHypothesisId
      problems
      customerSegments {
        id
        name
        description
      }
      uniqueProposition
      solutions
      keyMetrics
      channels {
        channelType
        variants {
          name
          url
        }
      }
      costStructure
      revenueStream
      unfairAdvantages
      threadId
    }
  }
`;

export interface ProjectHypothesisIdPromptPartInput {
  projectHypothesisId: string | null;
  promptPart: string | null;
}

export interface RegenerateHypothesesCoreResponse {
  regenerateHypothesesCore: HypothesesCoreDto;
}

export const regenerateHypothesesCoreMutation = (variables: {
  input: ProjectHypothesisIdPromptPartInput;
}) => {
  return MUTATE<RegenerateHypothesesCoreResponse>({
    mutation: REGENERATE_HYPOTHESES_CORE,
    variables,
  });
};
