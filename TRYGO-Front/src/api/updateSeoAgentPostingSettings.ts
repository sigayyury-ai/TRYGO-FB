import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { PostingSettingsDto } from "./getSeoAgentPostingSettings";

export const UPDATE_SEO_AGENT_POSTING_SETTINGS = gql`
  mutation UpdateSeoAgentPostingSettings($input: PostingSettingsInput!) {
    updateSeoAgentPostingSettings(input: $input) {
      id
      projectId
      hypothesisId
      weeklyPublishCount
      preferredDays
      autoPublishEnabled
      language
      wordpressBaseUrl
      wordpressUsername
      wordpressConnected
      wordpressDefaultCategoryId
      wordpressDefaultTagIds
      wordpressPostType
      updatedAt
    }
  }
`;

export interface PostingSettingsInput {
  projectId: string;
  hypothesisId?: string;
  weeklyPublishCount: number;
  preferredDays: string[];
  autoPublishEnabled: boolean;
  language?: string | null;
  wordpressBaseUrl?: string | null;
  wordpressUsername?: string | null;
  wordpressAppPassword?: string | null;
  wordpressDefaultCategoryId?: number | null;
  wordpressDefaultTagIds?: number[];
  wordpressPostType?: string | null;
}

export interface UpdateSeoAgentPostingSettingsResponse {
  updateSeoAgentPostingSettings: PostingSettingsDto;
}

export const updateSeoAgentPostingSettingsMutation = (
  input: PostingSettingsInput
) => {
  return SEO_AGENT_MUTATE<UpdateSeoAgentPostingSettingsResponse>({
    mutation: UPDATE_SEO_AGENT_POSTING_SETTINGS,
    variables: { input },
  });
};

