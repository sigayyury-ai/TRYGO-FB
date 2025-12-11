import { gql } from '@apollo/client';
import { client } from '../config/apollo/client';
import { Subscription } from '../types/SubscriptionType';

const GET_SUBSCRIPTION = gql`
  query GetSubscription {
    getSubscription {
      id
      userId
      price
      status
      endDate
      stripeSubscriptionId
      customerId
      startDate
      type
    }
  }
`;

export const getSubscription = async (): Promise<Subscription | null> => {
  try {
    const { data } = await client.query({
      query: GET_SUBSCRIPTION,
      fetchPolicy: 'network-only'
    });
    
    return data.getSubscription;
  } catch (error) {
    return null;
  }
};
