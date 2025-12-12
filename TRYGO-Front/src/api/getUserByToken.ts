import { gql } from '@apollo/client';
import { QUERY } from '@/config/apollo/client';

export const GET_USER_BY_TOKEN = gql`
  query GetUserByToken {
    getUserByToken {
      user {
        id
        email
        role
        freeTrialDueTo
        isProjectGenerated
      }
      token
    }
  }
`;

export interface GetUserByTokenResponseType {
  getUserByToken: {
    user: {
      id: string;
      email: string;
      role: 'ADMIN' | 'USER';
      freeTrialDueTo?: string;
      isProjectGenerated: boolean;
    };
    token: string;
  };
}

export const getUserByTokenQuery = async () => {
  const { data, error } = await QUERY<GetUserByTokenResponseType>({
    query: GET_USER_BY_TOKEN,
    fetchPolicy: 'no-cache',
  });

  if (error) {
    throw error;
  }

  return data?.getUserByToken;
};
