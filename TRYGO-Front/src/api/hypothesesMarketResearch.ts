import { gql } from '@apollo/client';
import { QUERY, MUTATE } from '@/config/apollo/client';
import { stripTypename } from '@apollo/client/utilities';

export const GET_HYPOTHESES_MARKET_RESEARCH = gql`
  query GetHypothesesMarketResearch($projectHypothesisId: ID!) {
    getHypothesesMarketResearch(projectHypothesisId: $projectHypothesisId) {
      id
      userId
      projectHypothesisId
      competitors {
        name
        url
        description
        distributionChannels
        socialMedias {
          name
          url
        }
        pricing
        advertisingSlogans
        leadMagnets
        positiveReviews
        negativeReviews
      }
      leadMagnets {
        name
        byCompetitor
      }
      ctas {
        name
        byCompetitor
      }
      offers {
        name
        byCompetitor
      }
      positiveReviews {
        name
        byCompetitor
      }
      negativeReviews {
        name
        byCompetitor
      }
      reviewsSummary
      swotAnalyse {
        strengths
        weaknesses
        opportunities
        threats
      }
    }
  }
`;

export const CHANGE_HYPOTHESES_MARKET_RESEARCH = gql`
  mutation ChangeHypothesesMarketResearch(
    $input: ChangeHypothesesMarketResearchInput!
  ) {
    changeHypothesesMarketResearch(input: $input) {
      id
      userId
      projectHypothesisId
      competitors {
        name
        url
        description
        distributionChannels
        socialMedias {
          name
          url
        }
        pricing
        advertisingSlogans
        leadMagnets
        positiveReviews
        negativeReviews
      }
      leadMagnets {
        name
        byCompetitor
      }
      ctas {
        name
        byCompetitor
      }
      offers {
        name
        byCompetitor
      }
      positiveReviews {
        name
        byCompetitor
      }
      negativeReviews {
        name
        byCompetitor
      }
      reviewsSummary
      swotAnalyse {
        strengths
        weaknesses
        opportunities
        threats
      }
    }
  }
`;

export interface CompetitorSocialMediaInput {
  name: string;
  url: string;
}

export interface CompetitorInput {
  name: string;
  url: string;
  description: string;
  distributionChannels: string[];
  socialMedias: CompetitorSocialMediaInput[];
  pricing: string[];
  advertisingSlogans: string[];
  leadMagnets: string[];
  positiveReviews: string[];
  negativeReviews: string[];
}

export interface NameByCompetitorInput {
  name: string;
  byCompetitor: string;
}

export interface SwotAnalyseInput {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ChangeHypothesesMarketResearchInput {
  id: string;
  competitors?: CompetitorInput[];
  leadMagnets?: NameByCompetitorInput[];
  ctas?: NameByCompetitorInput[];
  offers?: NameByCompetitorInput[];
  positiveReviews?: NameByCompetitorInput[];
  negativeReviews?: NameByCompetitorInput[];
  reviewsSummary?: string;
  swotAnalyse?: SwotAnalyseInput;
}

export interface CompetitorSocialMediaDto {
  name: string;
  url: string;
}

export interface CompetitorDto {
  name: string;
  url: string;
  description: string;
  distributionChannels: string[];
  socialMedias: CompetitorSocialMediaDto[];
  pricing: string[];
  advertisingSlogans: string[];
  leadMagnets: string[];
  positiveReviews: string[];
  negativeReviews: string[];
}

export interface NameByCompetitorDto {
  name: string;
  byCompetitor: string;
}

export interface SwotAnalyseDto {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface HypothesesMarketResearchDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  competitors: CompetitorDto[];
  leadMagnets: NameByCompetitorDto[];
  ctas: NameByCompetitorDto[];
  offers: NameByCompetitorDto[];
  positiveReviews: NameByCompetitorDto[];
  negativeReviews: NameByCompetitorDto[];
  reviewsSummary: string;
  swotAnalyse: SwotAnalyseDto;
}

export const getHypothesesMarketResearchQuery = (
  projectHypothesisId: string
) => {
  return QUERY<{ getHypothesesMarketResearch: HypothesesMarketResearchDto }>({
    query: GET_HYPOTHESES_MARKET_RESEARCH,
    variables: { projectHypothesisId },
    fetchPolicy: 'network-only',
  });
};

export const changeHypothesesMarketResearchMutation = (variables: {
  input: ChangeHypothesesMarketResearchInput;
}) => {
  const cleanedVariables = {
    input: stripTypename(variables.input),
  };
  return MUTATE<{
    changeHypothesesMarketResearch: HypothesesMarketResearchDto;
  }>({
    mutation: CHANGE_HYPOTHESES_MARKET_RESEARCH,
    variables: cleanedVariables,
  });
};
