import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { SeoClusterDto, ClusterIntent } from "./getSeoAgentClusters";

export const UPDATE_SEO_AGENT_CLUSTER = gql`
  mutation UpdateSeoAgentCluster($id: ID!, $input: SeoClusterInput!) {
    updateSeoAgentCluster(id: $id, input: $input) {
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
  title: string;
  intent: ClusterIntent;
  keywords: string[];
}

export interface UpdateSeoAgentClusterResponse {
  updateSeoAgentCluster: SeoClusterDto;
}

export const updateSeoAgentClusterMutation = (
  id: string,
  input: SeoClusterInput
) => {
  return SEO_AGENT_MUTATE<UpdateSeoAgentClusterResponse>({
    mutation: UPDATE_SEO_AGENT_CLUSTER,
    variables: { id, input },
  });
};

