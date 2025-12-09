import { gql } from '@apollo/client';
import { client } from '../config/apollo/client';

const GET_SUBSCRIPTION_STRIPE_SESSION = gql`
  query GetSubscriptionStripeSession {
    getSubscriptionStripeSession
  }
`;

export const getSubscriptionStripeSession = async (): Promise<string> => {
  try {
    const { data } = await client.query({
      query: GET_SUBSCRIPTION_STRIPE_SESSION,
      fetchPolicy: 'network-only'
    });
    
    return data.getSubscriptionStripeSession;
  } catch (error) {
    throw error;
  }
};
