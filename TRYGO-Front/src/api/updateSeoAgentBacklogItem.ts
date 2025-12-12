import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { BacklogIdeaDto, BacklogContentType, BacklogStatus } from "./getSeoAgentBacklog";

export const UPDATE_SEO_AGENT_BACKLOG_ITEM = gql`
  mutation UpdateSeoAgentBacklogIdea($id: ID!, $input: SeoAgentBacklogIdeaInput!) {
    updateSeoAgentBacklogIdea(id: $id, input: $input) {
      id
      projectId
      hypothesisId
      title
      description
      contentType
      clusterId
      status
      scheduledDate
      createdAt
      updatedAt
    }
  }
`;

// NOTE: SeoAgentBacklogIdeaInput only supports: title, description, category, status, scheduledDate
// contentType and clusterId are NOT part of the input type (they are read-only fields)
export interface UpdateSeoAgentBacklogItemInput {
  title?: string;
  description?: string;
  status?: BacklogStatus;
  scheduledDate?: string | null;
}

export interface UpdateSeoAgentBacklogItemResponse {
  updateSeoAgentBacklogIdea: BacklogIdeaDto;
}

export const updateSeoAgentBacklogItemMutation = (
  id: string,
  input: UpdateSeoAgentBacklogItemInput
) => {
  return SEO_AGENT_MUTATE<UpdateSeoAgentBacklogItemResponse>({
    mutation: UPDATE_SEO_AGENT_BACKLOG_ITEM,
    variables: { id, input },
  });
};

