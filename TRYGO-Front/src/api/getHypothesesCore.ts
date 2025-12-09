import { gql } from "@apollo/client";
import { QUERY } from "@/config/apollo/client";

export const GET_HYPOTHESES_CORE = gql`
  query GetHypothesesCore($projectHypothesisId: ID!) {
    getHypothesesCore(projectHypothesisId: $projectHypothesisId) {
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

export interface CustomerSegmentDto {
  name: string;
  description: string;
  id: string
}

export type ChannelType =
  | "ORGANIC_SEARCH"
  | "PAID_SEARCH"
  | "ORGANIC_SOCIAL_MEDIA"
  | "PAID_SOCIAL_MEDIA"
  | "PARTNERS";

export interface ChannelVariant {
  name: string;
  url: string;
}

export interface ChannelDto {
  channelType: ChannelType;
  variants: ChannelVariant[];
}

export interface HypothesesCoreDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  problems: string[];
  customerSegments: CustomerSegmentDto[];
  uniqueProposition: string;
  solutions: string[];
  keyMetrics: string[];
  channels: ChannelDto[];
  costStructure: string;
  revenueStream: string;
  unfairAdvantages: string[];
}

export interface GetHypothesesCoreResponse {
  getHypothesesCore: HypothesesCoreDto;
}

export const getHypothesesCoreQuery = (projectHypothesisId: string) => {
  return QUERY<GetHypothesesCoreResponse>({
    query: GET_HYPOTHESES_CORE,
    variables: { projectHypothesisId },
    fetchPolicy: "network-only",
  });
};
