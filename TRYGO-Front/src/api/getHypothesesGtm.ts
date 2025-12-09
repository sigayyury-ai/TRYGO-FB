import { gql } from "@apollo/client";
import { QUERY } from "@/config/apollo/client";

export const GET_HYPOTHESES_GTM = gql`
  query GetHypothesesGtm($projectHypothesisId: ID!) {
    getHypothesesGtm(projectHypothesisId: $projectHypothesisId) {
      id
      userId
      threadId
      projectHypothesisId
      stageValidate {
        channels {
          id
          name
          type
          description
          kpis
          status
          strategy
        }
        name
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
        channels {
          id
          name
          type
          description
          kpis
          status
          strategy
        }
        name
      }
    }
  }
`;

export interface HypothesesGtm {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string
  stageValidate: StageType;
  stageBuildAudience: StageType;
  stageScale: StageType;
}

export interface StageType {
  name: string;
  channels: ChannelsType[];
}

export interface ChannelsType {
  id: string;
  name: string;
  type: Type;
  description: string;
  kpis: string;
  status: StatusType;
  strategy: string;
}

export type StatusType = "PLANNED" | "IN_PROGRESS" | "COMPLETED";
export type Type =
  | "ORGANIC_SEARCH"
  | "PAID_SEARCH"
  | "ORGANIC_SOCIAL_MEDIA"
  | "PAID_SOCIAL_MEDIA"
  | "PARTNERS";

export interface GetHypothesesGtmResponse {
  getHypothesesGtm: HypothesesGtm;
}

export const getHypothesesGtmQuery = (projectHypothesisId: string) => {
  return QUERY<GetHypothesesGtmResponse>({
    query: GET_HYPOTHESES_GTM,
    variables: { projectHypothesisId },
    fetchPolicy: "network-only",
  });
};
