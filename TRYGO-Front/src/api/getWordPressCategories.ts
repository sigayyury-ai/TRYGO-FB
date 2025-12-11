import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_WORDPRESS_CATEGORIES = gql`
  query GetWordPressCategories($input: TestWordPressConnectionInput!) {
    wordpressCategories(input: $input) {
      id
      name
      slug
      count
    }
  }
`;

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface GetWordPressCategoriesResponse {
  wordpressCategories: WordPressCategory[];
}

export interface GetWordPressCategoriesInput {
  wordpressBaseUrl: string;
  wordpressUsername: string;
  wordpressAppPassword: string;
  postType?: string;
}

export const getWordPressCategoriesQuery = (
  input: GetWordPressCategoriesInput
) => {
  return SEO_AGENT_QUERY<GetWordPressCategoriesResponse>({
    query: GET_WORDPRESS_CATEGORIES,
    variables: { input },
  });
};

