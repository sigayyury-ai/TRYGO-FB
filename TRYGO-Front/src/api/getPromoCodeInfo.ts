import { gql } from '@apollo/client';
import { client } from '../config/apollo/client';
import { SubscriptionType } from '../types/SubscriptionType';

const GET_PROMO_CODE_INFO = gql`
  query GetPromoCodeInfo($code: String!) {
    getPromoCodeInfo(code: $code) {
      code
      subscriptionType
      durationMonths
      isValid
      message
    }
  }
`;

export interface PromoCodeInfo {
  code: string;
  subscriptionType: SubscriptionType;
  durationMonths: number;
  isValid: boolean;
  message?: string;
}

export const getPromoCodeInfo = async (code: string): Promise<PromoCodeInfo> => {
  try {
    const { data } = await client.query({
      query: GET_PROMO_CODE_INFO,
      variables: { code: code.toUpperCase().trim() },
      fetchPolicy: 'network-only'
    });
    
    return data.getPromoCodeInfo;
  } catch (error: any) {
    throw new Error(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to get promo code info');
  }
};

