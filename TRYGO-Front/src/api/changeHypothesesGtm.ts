import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { StageType } from "./getHypothesesGtm";

export const CHANGE_HYPOTHESES_GTM = gql`
  mutation ChangeHypothesesGtm($input: ChangeHypothesesGtmInput!) {
    changeHypothesesGtm(input: $input) {
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

export interface HypothesesGtmDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  stageValidate: StageType;
  stageBuildAudience: StageType;
  stageScale: StageType;
}

export type Channel = {
  id: string;
  name?: string | null;
  description?: string | null;
  kpi?: string | null;
  status?: string | null;
  strategy?: string | null;
  type?: string | null;
};

export type StageTypes = {
  name?: string | null;
  channels: Channel[];
};

export interface ChangeHypothesesGtmInput {
  id: string;
  stageValidate?: StageTypes | null;
  stageBuildAudience?: StageTypes | null;
  stageScale?: StageTypes | null;
}

export interface ChangeHypothesisGtmResponse {
  changeHypothesesGtm: HypothesesGtmDto;
}

export const changeHypothesesGtmMutation = (variables: {
  input: ChangeHypothesesGtmInput;
}) => {
  return MUTATE<ChangeHypothesisGtmResponse>({
    mutation: CHANGE_HYPOTHESES_GTM,
    variables,
  });
};
