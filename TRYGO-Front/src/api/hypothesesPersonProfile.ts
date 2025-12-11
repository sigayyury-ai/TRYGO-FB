import { gql } from "@apollo/client";
import { QUERY, MUTATE } from "@/config/apollo/client";

export const GET_HYPOTHESES_PERSON_PROFILE = gql`
  query GetAllHypothesesPersonProfiles($projectHypothesisId: ID!) {
    getAllHypothesesPersonProfiles(projectHypothesisId: $projectHypothesisId) {
      id
      userId
      projectHypothesisId
      customerSegmentId
      name
      avatarUrl
      description
      platforms
      age
      location
      education
      userGoals
      userPains
      userGains
      userTriggers
      jbtd {
        functionalAspects
        personalDimension
        socialDimension
      }
      cjm {
        awareness {
          opportunities
          barriers
        }
        consideration {
          opportunities
          barriers
        }
        acquisition {
          opportunities
          barriers
        }
        service {
          opportunities
          barriers
        }
        loyalty {
          opportunities
          barriers
        }
      }
    }
  }
`;

export const CHANGE_HYPOTHESES_PERSON_PROFILE = gql`
  mutation ChangeHypothesesPersonProfile(
    $input: ChangeHypothesesPersonProfileInput!
  ) {
    changeHypothesesPersonProfile(input: $input) {
      id
      userId
      projectHypothesisId
      name
      avatarUrl
      description
      platforms
      age
      location
      education
      userGoals
      userPains
      userGains
      userTriggers
      jbtd {
        functionalAspects
        personalDimension
        socialDimension
      }
      cjm {
        awareness {
          opportunities
          barriers
        }
        consideration {
          opportunities
          barriers
        }
        acquisition {
          opportunities
          barriers
        }
        service {
          opportunities
          barriers
        }
        loyalty {
          opportunities
          barriers
        }
      }
    }
  }
`;

export interface JbtdType {
  __typename?: string;
  functionalAspects?: string;
  personalDimension?: string;
  socialDimension?: string;
}

export interface CjmItemType {
  opportunities: string;
  barriers: string;
}

export interface CjmType {
  __typename?: StaticRange,
  awareness: CjmItemType;
  consideration: CjmItemType;
  acquisition: CjmItemType;
  service: CjmItemType;
  loyalty: CjmItemType;
}

export interface HypothesesPersonProfileDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  customerSegmentId: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  platforms: string[];
  age?: number;
  location?: string;
  education?: string;
  userGoals: string[];
  userPains: string[];
  userGains: string[];
  userTriggers: string[];
  jbtd: JbtdType;
  cjm: CjmType;
}

export interface GetHypothesesPersonProfileResponse {
  getAllHypothesesPersonProfiles: HypothesesPersonProfileDto[];
}

export interface ChangeHypothesesPersonProfileInput {
  id: string;
  name?: string;
  avatarUrl?: string;
  description?: string;
  platforms?: string[];
  age?: number;
  location?: string;
  education?: string;
  userGoals?: string[];
  userPains?: string[];
  userGains?: string[];
  userTriggers?: string[];
  jbtd?: JbtdType;
  cjm?: CjmType;
}

export const getHypothesesPersonProfileQuery = (
  projectHypothesisId: string
) => {
  return QUERY<GetHypothesesPersonProfileResponse>({
    query: GET_HYPOTHESES_PERSON_PROFILE,
    variables: { projectHypothesisId },
    fetchPolicy: "network-only",
  });
};

export const changeHypothesesPersonProfileMutation = (
  input: ChangeHypothesesPersonProfileInput
) => {
  return MUTATE({
    mutation: CHANGE_HYPOTHESES_PERSON_PROFILE,
    variables: { input },
  });
};
