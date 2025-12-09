import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { ContentIdeaDto, ContentCategory, ContentIdeaType } from "./getSeoAgentContentIdeas";

export const CREATE_CUSTOM_CONTENT_IDEA = gql`
  mutation CreateCustomContentIdea($input: CreateCustomContentIdeaInput!) {
    createCustomContentIdea(input: $input) {
      id
      projectId
      hypothesisId
      title
      description
      category
      contentType
      clusterId
      status
      dismissed
      createdAt
      updatedAt
    }
  }
`;

export interface CreateCustomContentIdeaInput {
  projectId: string;
  hypothesisId?: string;
  title: string;
  description?: string;
  category: ContentCategory;
  contentType: ContentIdeaType;
  clusterId?: string;
}

export interface CreateCustomContentIdeaResponse {
  createCustomContentIdea: ContentIdeaDto;
}

export const createCustomContentIdeaMutation = (
  input: CreateCustomContentIdeaInput
) => {
  return SEO_AGENT_MUTATE<CreateCustomContentIdeaResponse>({
    mutation: CREATE_CUSTOM_CONTENT_IDEA,
    variables: { input },
  });
};

