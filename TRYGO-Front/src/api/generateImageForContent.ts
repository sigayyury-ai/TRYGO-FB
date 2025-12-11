import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const GENERATE_IMAGE_FOR_CONTENT = gql`
  mutation GenerateImageForContent($input: GenerateImageInput!) {
    generateImageForContent(input: $input) {
      id
      imageUrl
      updatedAt
    }
  }
`;

export interface GenerateImageInput {
  contentItemId: string;
  title: string;
  description?: string;
}

export interface GenerateImageResponse {
  generateImageForContent: {
    id: string;
    imageUrl?: string;
    updatedAt: string;
  };
}

export const generateImageForContentMutation = (input: GenerateImageInput) => {
  return SEO_AGENT_MUTATE<GenerateImageResponse>({
    mutation: GENERATE_IMAGE_FOR_CONTENT,
    variables: { input },
  });
};

