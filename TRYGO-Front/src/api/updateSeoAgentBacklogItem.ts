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
      createdAt
      updatedAt
    }
  }
`;

export interface UpdateSeoAgentBacklogItemInput {
  title: string;
  description?: string;
  contentType: BacklogContentType;
  status: BacklogStatus;
  clusterId?: string;
  scheduledDate?: string;
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

