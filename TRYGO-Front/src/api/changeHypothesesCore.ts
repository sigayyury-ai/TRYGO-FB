import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';
import { ChannelType, ChannelVariant, HypothesesCoreDto } from './getHypothesesCore';
import { stripTypename } from '@apollo/client/utilities';

export const CHANGE_HYPOTHESES_CORE = gql`
  mutation ChangeHypothesesCore($input: ChangeHypothesesCoreInput!) {
    changeHypothesesCore(input: $input) {
      id
      userId
      projectHypothesisId
      problems
      customerSegments {
        name
        description
        id
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
    }
  }
`;

export interface CustomerSegmentInput {
  name: string;
  description: string;
  id?: string
}

export interface ChannelInput {
  channelType: ChannelType;
  variants: ChannelVariant[];
}

export interface ChangeHypothesesCoreInput {
  id: string;
  problems?: string[];
  customerSegments?: CustomerSegmentInput[];
  uniqueProposition?: string;
  solutions?: string[];
  keyMetrics?: string[];
  channels?: ChannelInput[];
  costStructure?: string;
  revenueStream?: string;
  unfairAdvantages?: string[];
}

export interface ChangeHypothesesCoreResponse {
  changeHypothesesCore: HypothesesCoreDto;
}

export const changeHypothesesCoreMutation = (variables: {
  input: ChangeHypothesesCoreInput;
}) => {
  const cleanedVariables = {
    input: stripTypename(variables.input),
  };

  return MUTATE<ChangeHypothesesCoreResponse>({
    mutation: CHANGE_HYPOTHESES_CORE,
    variables: cleanedVariables,
  });
};
