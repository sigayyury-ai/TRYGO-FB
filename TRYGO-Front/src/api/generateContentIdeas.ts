import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";
import { gql } from "@apollo/client";

const GENERATE_CONTENT_IDEAS = gql`
  mutation GenerateContentIdeas($projectId: ID!, $hypothesisId: ID!, $category: String) {
    generateContentIdeas(projectId: $projectId, hypothesisId: $hypothesisId, category: $category) {
      id
      projectId
      hypothesisId
      title
      description
      category
      contentType
      status
      dismissed
      createdAt
      updatedAt
    }
  }
`;

export interface GenerateContentIdeasVariables {
  projectId: string;
  hypothesisId: string;
  category?: string;
}

export interface GenerateContentIdeasResponse {
  generateContentIdeas: Array<{
    id: string;
    projectId: string;
    hypothesisId: string | null;
    title: string;
    description: string | null;
    category: string;
    contentType: string;
    status: string;
    dismissed: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

export async function generateContentIdeasMutation(
  variables: GenerateContentIdeasVariables
): Promise<GenerateContentIdeasResponse["generateContentIdeas"]> {
  try {
    const result = await SEO_AGENT_MUTATE<GenerateContentIdeasResponse, GenerateContentIdeasVariables>({
      mutation: GENERATE_CONTENT_IDEAS,
      variables
    });

    if (result.errors) {
      console.error("[generateContentIdeasMutation] GraphQL errors:", result.errors);
      throw new Error(result.errors[0]?.message || "Failed to generate content ideas");
    }

    // Removed success logging - only log errors to prevent memory issues
    return result.data?.generateContentIdeas || [];
  } catch (error) {
    console.error("[generateContentIdeasMutation] Error:", error);
    if (error instanceof Error) {
      console.error("[generateContentIdeasMutation] Error message:", error.message);
      console.error("[generateContentIdeasMutation] Error stack:", error.stack);
    }
    throw error;
  }
}

