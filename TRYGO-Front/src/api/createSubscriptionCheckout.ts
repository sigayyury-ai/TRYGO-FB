import { gql } from '@apollo/client';
import { client } from '../config/apollo/client';
import { SubscriptionType } from '../types/SubscriptionType';

const CREATE_SUBSCRIPTION_CHECKOUT = gql`
  mutation CreateSubscriptionCheckout($type: SubscriptionType) {
    createSubscriptionCheckout(type: $type)
  }
`;

export const createSubscriptionCheckout = async (type: SubscriptionType): Promise<string> => {
  try {
    const { data } = await client.mutate({
      mutation: CREATE_SUBSCRIPTION_CHECKOUT,
      variables: { type }
    });
    
    return data.createSubscriptionCheckout;
  } catch (error) {
    throw error;
  }
};
