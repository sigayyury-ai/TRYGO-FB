import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';

export const DELETE_PROJECT_HYPOTHESIS = gql`
  mutation DeleteProjectHypothesis($deleteProjectHypothesisId: ID!) {
    deleteProjectHypothesis(id: $deleteProjectHypothesisId)
  }
`;

export interface DeleteProjectHypothesisResponse {
  deleteProjectHypothesis: boolean;
}

export const deleteProjectHypothesisMutation = (variables: {
  deleteProjectHypothesisId: string;
}) => {
  return MUTATE<DeleteProjectHypothesisResponse>({
    mutation: DELETE_PROJECT_HYPOTHESIS,
    variables,
  });
};
