import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_WORDPRESS_TAGS = gql`
  query GetWordPressTags($input: TestWordPressConnectionInput!) {
    wordpressTags(input: $input) {
      id
      name
      slug
      count
    }
  }
`;

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface GetWordPressTagsResponse {
  wordpressTags: WordPressTag[];
}

export interface GetWordPressTagsInput {
  wordpressBaseUrl: string;
  wordpressUsername: string;
  wordpressAppPassword: string;
  postType?: string;
}

export const getWordPressTagsQuery = (
  input: GetWordPressTagsInput
) => {
  return SEO_AGENT_QUERY<GetWordPressTagsResponse>({
    query: GET_WORDPRESS_TAGS,
    variables: { input },
  });
};

