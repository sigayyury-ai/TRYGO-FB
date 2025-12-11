import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

const REWRITE_TEXT_SELECTION = gql`
  mutation RewriteTextSelection($input: RewriteTextSelectionInput!) {
    rewriteTextSelection(input: $input) {
      rewrittenText
      success
      error
    }
  }
`;

export interface RewriteTextSelectionInput {
  contentItemId: string;
  selectedText: string;
  contextBefore?: string;
  contextAfter?: string;
  instruction?: string;
}

export interface RewriteTextSelectionResponse {
  rewriteTextSelection: {
    rewrittenText: string;
    success: boolean;
    error: string | null;
  };
}

export const rewriteTextSelectionMutation = (input: RewriteTextSelectionInput) => {
  console.log("[rewriteTextSelectionMutation] Calling mutation with input:", {
    contentItemId: input.contentItemId,
    selectedTextLength: input.selectedText.length,
    hasContextBefore: !!input.contextBefore,
    hasContextAfter: !!input.contextAfter,
    hasInstruction: !!input.instruction
  });
  
  return SEO_AGENT_MUTATE<RewriteTextSelectionResponse>({
    mutation: REWRITE_TEXT_SELECTION,
    variables: { input },
  }).catch((error) => {
    console.error("[rewriteTextSelectionMutation] Error:", error);
    throw error;
  });
};

