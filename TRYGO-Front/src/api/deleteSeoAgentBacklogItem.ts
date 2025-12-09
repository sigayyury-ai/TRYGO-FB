import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const DELETE_SEO_AGENT_BACKLOG_ITEM = gql`
  mutation DeleteSeoAgentBacklogIdea($id: ID!) {
    deleteSeoAgentBacklogIdea(id: $id)
  }
`;

export interface DeleteSeoAgentBacklogItemResponse {
  deleteSeoAgentBacklogIdea: boolean;
}

export const deleteSeoAgentBacklogItemMutation = (id: string) => {
  return SEO_AGENT_MUTATE<DeleteSeoAgentBacklogItemResponse>({
    mutation: DELETE_SEO_AGENT_BACKLOG_ITEM,
    variables: { id },
  });
};

