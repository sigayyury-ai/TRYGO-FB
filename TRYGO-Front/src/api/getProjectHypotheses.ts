import { gql } from '@apollo/client';
import { QUERY } from '@/config/apollo/client';

export const GET_PROJECT_HYPOTHESES = gql`
  query GetProjectHypotheses($projectId: ID!) {
    getProjectHypotheses(projectId: $projectId) {
      id
      userId
      projectId
      title
      description
      createdAt
    }
  }
`;

export interface ProjectHypothesis {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface GetProjectHypothesesResponse {
  getProjectHypotheses: ProjectHypothesis[];
}

export const getProjectHypothesesQuery = (projectId: string) => {
  return QUERY<GetProjectHypothesesResponse>({
    query: GET_PROJECT_HYPOTHESES,
    variables: { projectId },
    fetchPolicy: 'network-only',
  });
};
