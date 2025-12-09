import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { ContentIdeaDto } from "./getSeoAgentContentIdeas";

export const DISMISS_CONTENT_IDEA = gql`
  mutation DismissContentIdea($id: ID!) {
    dismissContentIdea(id: $id) {
      id
      dismissed
      status
      updatedAt
    }
  }
`;

export interface DismissContentIdeaResponse {
  dismissContentIdea: {
    id: string;
    dismissed: boolean;
    status: string;
    updatedAt: string;
  };
}

export const dismissContentIdeaMutation = (id: string) => {
  return SEO_AGENT_MUTATE<DismissContentIdeaResponse>({
    mutation: DISMISS_CONTENT_IDEA,
    variables: { id },
  });
};

