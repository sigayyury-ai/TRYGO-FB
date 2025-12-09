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

