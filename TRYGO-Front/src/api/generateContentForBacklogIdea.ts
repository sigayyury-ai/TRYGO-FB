import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const GENERATE_CONTENT_FOR_BACKLOG_IDEA = gql`
  mutation GenerateContentForBacklogIdea($input: GenerateContentInput!) {
    generateContentForBacklogIdea(input: $input) {
      id
      projectId
      hypothesisId
      backlogIdeaId
      title
      category
      format
      outline
      content
      imageUrl
      status
      createdAt
      updatedAt
    }
  }
`;

export interface GenerateContentInput {
  backlogIdeaId: string;
  projectId: string;
  hypothesisId?: string;
}

export interface GenerateContentResponse {
  generateContentForBacklogIdea: {
    id: string;
    projectId: string;
    hypothesisId: string;
    backlogIdeaId?: string;
    title: string;
    category: string;
    format: string;
    outline?: string;
    content?: string;
    imageUrl?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

export const generateContentForBacklogIdeaMutation = (input: GenerateContentInput) => {
  return SEO_AGENT_MUTATE<GenerateContentResponse>({
    mutation: GENERATE_CONTENT_FOR_BACKLOG_IDEA,
    variables: { input },
  });
};

