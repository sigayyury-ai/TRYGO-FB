import { gql } from "@apollo/client";
import { SEO_AGENT_MUTATE } from "@/config/apollo/client/seoAgentClient";

export const TEST_WORDPRESS_CONNECTION = gql`
  mutation TestWordPressConnection($input: TestWordPressConnectionInput!) {
    testWordPressConnection(input: $input) {
      success
      message
      error
    }
  }
`;

export interface TestWordPressConnectionInput {
  wordpressBaseUrl: string;
  wordpressUsername: string;
  wordpressAppPassword: string;
}

export interface TestWordPressConnectionResponse {
  testWordPressConnection: {
    success: boolean;
    message?: string | null;
    error?: string | null;
  };
}

export const testWordPressConnectionMutation = (
  input: TestWordPressConnectionInput
) => {
  return SEO_AGENT_MUTATE<TestWordPressConnectionResponse>({
    mutation: TEST_WORDPRESS_CONNECTION,
    variables: { input },
  });
};

