import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { ClusterIntent, SeoClusterDto } from "./getSeoAgentClusters";

export const CREATE_SEO_AGENT_CLUSTER = gql`
  mutation CreateSeoAgentCluster($input: SeoClusterInput!) {
    createSeoAgentCluster(input: $input) {
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

export interface SeoClusterInput {
  projectId: string;
  hypothesisId?: string;
  title: string;
  intent: ClusterIntent;
  keywords: string[];
}

export interface CreateSeoAgentClusterResponse {
  createSeoAgentCluster: SeoClusterDto;
}

export const createSeoAgentClusterMutation = (input: SeoClusterInput) => {
  return SEO_AGENT_MUTATE<CreateSeoAgentClusterResponse>({
    mutation: CREATE_SEO_AGENT_CLUSTER,
    variables: { input },
  });
};

