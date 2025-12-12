import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { BacklogContentType } from "./getSeoAgentBacklog";

export const ADD_CONTENT_IDEA_TO_BACKLOG = gql`
  mutation AddContentIdeaToBacklog($input: AddContentIdeaToBacklogInput!) {
    addContentIdeaToBacklog(input: $input) {
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

export interface AddContentIdeaToBacklogInput {
  contentIdeaId: string;
  title: string;
  description?: string;
  contentType: BacklogContentType;
  clusterId?: string | null;
}

export interface AddContentIdeaToBacklogResponse {
  addContentIdeaToBacklog: {
    id: string;
    projectId: string;
    hypothesisId?: string;
    title: string;
    description?: string;
    contentType: BacklogContentType;
    clusterId?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const addContentIdeaToBacklogMutation = (
  input: AddContentIdeaToBacklogInput
) => {
  return SEO_AGENT_MUTATE<AddContentIdeaToBacklogResponse>({
    mutation: ADD_CONTENT_IDEA_TO_BACKLOG,
    variables: { input },
  });
};

