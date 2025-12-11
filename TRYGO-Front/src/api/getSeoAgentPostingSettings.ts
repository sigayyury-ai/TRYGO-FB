import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_SEO_AGENT_POSTING_SETTINGS = gql`
  query GetSeoAgentPostingSettings($projectId: ID!) {
    seoAgentPostingSettings(projectId: $projectId) {
      id
      projectId
      hypothesisId
      weeklyPublishCount
      preferredDays
      autoPublishEnabled
      language
      updatedAt
    }
  }
`;

export interface PostingSettingsDto {
  id: string;
  projectId: string;
  hypothesisId?: string;
  weeklyPublishCount: number;
  preferredDays: string[];
  autoPublishEnabled: boolean;
  language?: string | null;
  updatedAt: string;
}

export interface GetSeoAgentPostingSettingsResponse {
  seoAgentPostingSettings: PostingSettingsDto;
}

export const getSeoAgentPostingSettingsQuery = (projectId: string) => {
  return SEO_AGENT_QUERY<GetSeoAgentPostingSettingsResponse>({
    query: GET_SEO_AGENT_POSTING_SETTINGS,
    variables: { projectId },
    fetchPolicy: "network-only",
  });
};

