import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { StageType } from "./getHypothesesGtm";

export const CREATE_HYPOTHESES_GTM = gql`
  mutation CreateHypothesesGtm($projectHypothesisId: ID!) {
    createHypothesesGtm(projectHypothesisId: $projectHypothesisId) {
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

export interface CreateHypothesesGtmDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string
  stageValidate: StageType;
  stageBuildAudience: StageType;
  stageScale: StageType;
}

export interface CreateHypothesisGtmResponse {
  createHypothesesGtm: CreateHypothesesGtmDto;
}

export const createHypothesesGtmMutation = (
  projectHypothesisId: string
) => {
  return MUTATE<CreateHypothesisGtmResponse>({
    mutation: CREATE_HYPOTHESES_GTM,
    variables: { projectHypothesisId },
  });
};
