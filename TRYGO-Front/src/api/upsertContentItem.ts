import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const UPSERT_CONTENT_ITEM = gql`
  mutation UpsertContentItem($input: ContentItemInput!) {
    upsertContentItem(input: $input) {
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

export interface ContentItemInput {
  id?: string;
  projectId: string;
  hypothesisId: string;
  backlogIdeaId?: string;
  title: string;
  category: string;
  format: string;
  ownerId?: string;
  reviewerId?: string;
  channel?: string;
  outline?: string;
  content?: string;
  imageUrl?: string;
  status?: string;
  dueDate?: string;
  userId: string;
}

export interface UpsertContentItemResponse {
  upsertContentItem: {
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

export const upsertContentItemMutation = (input: ContentItemInput) => {
  return SEO_AGENT_MUTATE<UpsertContentItemResponse>({
    mutation: UPSERT_CONTENT_ITEM,
    variables: { input },
  });
};

