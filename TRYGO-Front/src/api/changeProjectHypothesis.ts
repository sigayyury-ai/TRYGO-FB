import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';

export const CHANGE_PROJECT_HYPOTHESIS = gql`
  mutation ChangeProjectHypothesis($input: ChangeProjectHypothesisInput!) {
    changeProjectHypothesis(input: $input) {
      id
      userId
      projectId
      title
      description
      createdAt
    }
  }
`;

export interface ChangeProjectHypothesisInput {
  id: string;
  title?: string;
  description?: string;
}

export interface ProjectHypothesisDto {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface ChangeProjectHypothesisResponse {
  changeProjectHypothesis: ProjectHypothesisDto;
}

export const changeProjectHypothesisMutation = (variables: {
  input: ChangeProjectHypothesisInput;
}) => {
  return MUTATE<ChangeProjectHypothesisResponse>({
    mutation: CHANGE_PROJECT_HYPOTHESIS,
    variables,
  });
};
