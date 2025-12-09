import { gql } from '@apollo/client';

export const CREATE_REQUEST_FEATURE = gql`
  mutation Mutation($requestedFeature: RequestedFeature!) {
    createRequestFeature(requestedFeature: $requestedFeature)
  }
`;

export interface CreateRequestFeatureVariables {
  requestedFeature: 'PITCH_MATERIALS' | 'BRANDING';
}

export interface CreateRequestFeatureResponse {
  createRequestFeature: boolean;
}
