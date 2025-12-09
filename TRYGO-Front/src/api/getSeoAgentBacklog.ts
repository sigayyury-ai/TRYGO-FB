import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_SEO_AGENT_BACKLOG = gql`
  query GetSeoAgentBacklog($projectId: ID!, $hypothesisId: ID) {
    seoAgentBacklog(projectId: $projectId, hypothesisId: $hypothesisId) {
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

export enum BacklogContentType {
  ARTICLE = "ARTICLE",
  COMMERCIAL_PAGE = "COMMERCIAL_PAGE",
  LANDING_PAGE = "LANDING_PAGE",
}

export enum BacklogStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export interface BacklogIdeaDto {
  id: string;
  projectId: string;
  hypothesisId?: string;
  title: string;
  description?: string;
  contentType: BacklogContentType;
  clusterId?: string;
  status: BacklogStatus;
  scheduledDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetSeoAgentBacklogResponse {
  seoAgentBacklog: BacklogIdeaDto[];
}

export const getSeoAgentBacklogQuery = (
  projectId: string,
  hypothesisId?: string
) => {
  const variables: { projectId: string; hypothesisId?: string } = { projectId };
  
  // Only include hypothesisId if it's defined and not empty
  if (hypothesisId && hypothesisId.trim() !== "") {
    variables.hypothesisId = hypothesisId;
  }
  
  console.log("Fetching backlog with variables:", variables);
  
  return SEO_AGENT_QUERY<GetSeoAgentBacklogResponse>({
    query: GET_SEO_AGENT_BACKLOG,
    variables,
    fetchPolicy: "network-only",
  });
};

