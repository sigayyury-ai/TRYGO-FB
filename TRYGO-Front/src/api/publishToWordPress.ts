import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const PUBLISH_TO_WORDPRESS = gql`
  mutation PublishToWordPress($input: PublishToWordPressInput!) {
    publishToWordPress(input: $input) {
      success
      wordPressPostId
      wordPressPostUrl
      error
    }
  }
`;

export interface PublishToWordPressInput {
  contentItemId: string;
  projectId: string;
  hypothesisId?: string;
  status?: string;
}

export interface PublishToWordPressResponse {
  publishToWordPress: {
    success: boolean;
    wordPressPostId: number | null;
    wordPressPostUrl: string | null;
    error: string | null;
  };
}

export const publishToWordPressMutation = (input: PublishToWordPressInput) => {
  return SEO_AGENT_MUTATE<PublishToWordPressResponse>({
    mutation: PUBLISH_TO_WORDPRESS,
    variables: { input },
  });
};

