import { gql } from "@apollo/client";
import { SEO_AGENT_QUERY } from "@/config/apollo/client/seoAgentClient";

export const GET_WORDPRESS_POST_TYPES = gql`
  query GetWordPressPostTypes($input: TestWordPressConnectionInput!) {
    wordpressPostTypes(input: $input) {
      name
      label
      public
    }
  }
`;

export interface WordPressPostType {
  name: string;
  label: string;
  public: boolean;
}

export interface GetWordPressPostTypesResponse {
  wordpressPostTypes: WordPressPostType[];
}

export const getWordPressPostTypesQuery = (
  input: { wordpressBaseUrl: string; wordpressUsername: string; wordpressAppPassword: string }
) => {
  return SEO_AGENT_QUERY<GetWordPressPostTypesResponse>({
    query: GET_WORDPRESS_POST_TYPES,
    variables: { input },
  });
};





