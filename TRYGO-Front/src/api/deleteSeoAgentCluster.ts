import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const DELETE_SEO_AGENT_CLUSTER = gql`
  mutation DeleteSeoAgentCluster($id: ID!) {
    deleteSeoAgentCluster(id: $id)
  }
`;

export interface DeleteSeoAgentClusterResponse {
  deleteSeoAgentCluster: boolean;
}

export const deleteSeoAgentClusterMutation = (id: string) => {
  return SEO_AGENT_MUTATE<DeleteSeoAgentClusterResponse>({
    mutation: DELETE_SEO_AGENT_CLUSTER,
    variables: { id },
  });
};

