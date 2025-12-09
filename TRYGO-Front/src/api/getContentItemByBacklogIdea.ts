import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_CONTENT_ITEM_BY_BACKLOG_IDEA = gql`
  query GetContentItemByBacklogIdea($backlogIdeaId: ID!) {
    contentItemByBacklogIdea(backlogIdeaId: $backlogIdeaId) {
      id
      projectId
      hypothesisId
      backlogIdeaId
      title
      outline
      content
      imageUrl
      category
      format
      status
      createdAt
      updatedAt
    }
  }
`;

export interface ContentItemByBacklogIdeaResponse {
  contentItemByBacklogIdea: {
    id: string;
    projectId: string;
    hypothesisId?: string;
    backlogIdeaId?: string;
    title: string;
    outline?: string;
    content?: string;
    imageUrl?: string;
    category: string;
    format: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const getContentItemByBacklogIdeaQuery = (backlogIdeaId: string) => {
  return SEO_AGENT_QUERY<ContentItemByBacklogIdeaResponse>({
    query: GET_CONTENT_ITEM_BY_BACKLOG_IDEA,
    variables: { backlogIdeaId },
    fetchPolicy: "network-only",
  });
};

