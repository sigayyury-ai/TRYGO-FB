import { gql } from '@apollo/client';
import { client } from '../config/apollo/client';
import { SubscriptionType } from '../types/SubscriptionType';

const CHANGE_SUBSCRIPTION_MUTATION = gql`
  mutation ChangeSubscription($type: SubscriptionType) {
    changeSubscription(type: $type)
  }
`;

export const changeSubscription = async (type: SubscriptionType): Promise<boolean> => {
  try {
    const { data } = await client.mutate({
      mutation: CHANGE_SUBSCRIPTION_MUTATION,
      variables: {
        type
      }
    });

    return data.changeSubscription;
  } catch (error) {
    console.error('Error changing subscription:', error);
    throw error;
  }
};
