import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';
import { HypothesesGtmDto } from './changeHypothesesGtm';

export const REGENERATE_HYPOTHESES_GTM = gql`
  mutation RegenerateHypothesesGtm($input: ProjectHypothesisIdPromptPartInput!) {
    regenerateHypothesesGtm(input: $input) {
      id
      userId
      threadId
      projectHypothesisId
      stageValidate {
        name
        channels {
          id
          name
          type
          description
          kpis
          status
          strategy
        }
      }
      stageBuildAudience {
        name
        channels {
          id
          name
          type
          description
          kpis
          status
          strategy
        }
      }
      stageScale {
        name
        channels {
          id
          name
          type
          description
          kpis
          status
          strategy
        }
      }
    }
  }
`;

export interface ProjectHypothesisIdPromptPartInput {
  projectHypothesisId: string | null;
  promptPart: string | null;
}

export interface RegenerateHypothesesGtmResponse {
  regenerateHypothesesGtm: HypothesesGtmDto;
}

export const regenerateHypothesesGtmMutation = (variables: {
  input: ProjectHypothesisIdPromptPartInput;
}) => {
  return MUTATE<RegenerateHypothesesGtmResponse>({
    mutation: REGENERATE_HYPOTHESES_GTM,
    variables,
  });
};
