import { gql } from '@apollo/client';
import { client } from '../config/apollo/client';
import { AssistantMessages } from '../types/SubscriptionType';

const GET_ASSISTANT_MESSAGES = gql`
  query GetAssistantMessages {
    getAssistantMessages {
      generatedMessages
      userId
      createdAt
    }
  }
`;

export const getAssistantMessages = async (): Promise<AssistantMessages | null> => {
  try {
    const { data } = await client.query({
      query: GET_ASSISTANT_MESSAGES,
      fetchPolicy: 'network-only'
    });
    
    return data.getAssistantMessages;
  } catch (error) {
    return null;
  }
};
