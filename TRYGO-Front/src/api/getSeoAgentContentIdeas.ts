import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_SEO_AGENT_CONTENT_IDEAS = gql`
  query GetSeoAgentContentIdeas($projectId: ID!, $hypothesisId: ID) {
    seoAgentContentIdeas(projectId: $projectId, hypothesisId: $hypothesisId) {
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

export enum ContentCategory {
  PAINS = "PAINS",
  GOALS = "GOALS",
  TRIGGERS = "TRIGGERS",
  PRODUCT_FEATURES = "PRODUCT_FEATURES",
  BENEFITS = "BENEFITS",
  FAQS = "FAQS",
  INFORMATIONAL = "INFORMATIONAL",
}

export enum ContentIdeaStatus {
  NEW = "NEW",
  ADDED_TO_BACKLOG = "ADDED_TO_BACKLOG",
  DISMISSED = "DISMISSED",
}

export enum ContentIdeaType {
  ARTICLE = "ARTICLE",
  COMMERCIAL_PAGE = "COMMERCIAL_PAGE",
  LANDING_PAGE = "LANDING_PAGE",
}

export interface ContentIdeaDto {
  id: string;
  projectId: string;
  hypothesisId?: string;
  title: string;
  description?: string;
  category: ContentCategory;
  contentType: ContentIdeaType;
  clusterId?: string;
  status: ContentIdeaStatus;
  dismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetSeoAgentContentIdeasResponse {
  seoAgentContentIdeas: ContentIdeaDto[];
}

export const getSeoAgentContentIdeasQuery = (
  projectId: string,
  hypothesisId?: string
) => {
  const variables: { projectId: string; hypothesisId?: string } = { projectId };
  
  if (hypothesisId && hypothesisId.trim() !== "") {
    variables.hypothesisId = hypothesisId;
  }
  
  console.log("Fetching content ideas with variables:", variables);
  
  return SEO_AGENT_QUERY<GetSeoAgentContentIdeasResponse>({
    query: GET_SEO_AGENT_CONTENT_IDEAS,
    variables,
    fetchPolicy: "network-only",
  });
};

