import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_SEO_AGENT_CLUSTERS = gql`
  query GetSeoAgentClusters($projectId: ID!, $hypothesisId: ID) {
    seoAgentClusters(projectId: $projectId, hypothesisId: $hypothesisId) {
      id
      projectId
      hypothesisId
      title
      intent
      keywords
      createdAt
      updatedAt
    }
  }
`;

export enum ClusterIntent {
  INFORMATIONAL = "INFORMATIONAL",
  NAVIGATIONAL = "NAVIGATIONAL",
  TRANSACTIONAL = "TRANSACTIONAL",
  COMMERCIAL = "COMMERCIAL",
}

export interface SeoClusterDto {
  id: string;
  projectId: string;
  hypothesisId?: string;
  title: string;
  intent: ClusterIntent;
  keywords: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GetSeoAgentClustersResponse {
  seoAgentClusters: SeoClusterDto[];
}

export const getSeoAgentClustersQuery = (
  projectId: string,
  hypothesisId?: string
) => {
  const variables: { projectId: string; hypothesisId?: string } = { projectId };
  
  // Only include hypothesisId if it's defined and not empty
  if (hypothesisId && hypothesisId.trim() !== "") {
    variables.hypothesisId = hypothesisId;
  }
  
  return SEO_AGENT_QUERY<GetSeoAgentClustersResponse>({
    query: GET_SEO_AGENT_CLUSTERS,
    variables,
    fetchPolicy: "network-only",
  });
};

