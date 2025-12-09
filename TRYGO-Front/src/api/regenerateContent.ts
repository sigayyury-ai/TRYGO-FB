import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const REGENERATE_CONTENT = gql`
  mutation RegenerateContent($id: ID!, $promptPart: String) {
    regenerateContent(id: $id, promptPart: $promptPart) {
      id
      content
      updatedAt
    }
  }
`;

export interface RegenerateContentResponse {
  regenerateContent: {
    id: string;
    content?: string;
    updatedAt: string;
  };
}

export const regenerateContentMutation = (id: string, promptPart?: string) => {
  return SEO_AGENT_MUTATE<RegenerateContentResponse>({
    mutation: REGENERATE_CONTENT,
    variables: { id, promptPart: promptPart || null },
  });
};

