import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const APPROVE_CONTENT_ITEM = gql`
  mutation ApproveContentItem($input: ApproveContentItemInput!) {
    approveContentItem(input: $input) {
      id
      status
      updatedAt
    }
  }
`;

export interface ApproveContentItemInput {
  contentItemId: string;
  projectId: string;
  hypothesisId?: string;
}

export interface ApproveContentItemResponse {
  approveContentItem: {
    id: string;
    status: string;
    updatedAt: string;
  };
}

export const approveContentItemMutation = (input: ApproveContentItemInput) => {
  return SEO_AGENT_MUTATE<ApproveContentItemResponse>({
    mutation: APPROVE_CONTENT_ITEM,
    variables: { input },
  });
};

