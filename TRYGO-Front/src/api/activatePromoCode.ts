import { gql } from '@apollo/client';
import { client } from '../config/apollo/client';

const ACTIVATE_PROMO_CODE = gql`
  mutation ActivatePromoCode($code: String!) {
    activatePromoCode(code: $code) {
      success
      message
    }
  }
`;

export interface ActivatePromoCodeResponse {
  success: boolean;
  message: string;
}

export const activatePromoCode = async (code: string): Promise<ActivatePromoCodeResponse> => {
  try {
    const { data } = await client.mutate({
      mutation: ACTIVATE_PROMO_CODE,
      variables: { code: code.toUpperCase().trim() }
    });
    
    return data.activatePromoCode;
  } catch (error: any) {
    throw new Error(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to activate promo code');
  }
};






