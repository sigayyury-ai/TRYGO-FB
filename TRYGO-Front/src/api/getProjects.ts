import { gql } from '@apollo/client';
import { QUERY } from '@/config/apollo/client';

export const GET_PROJECTS = gql`
  query GetProjects {
    getProjects {
      id
      userId
      title
      generationStatus
    }
  }
`;

export enum GenerationStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  GENERATED = 'GENERATED',
}

export interface ProjectDto {
  id: string;
  userId: string;
  title: string;
  generationStatus: GenerationStatus;
}

export interface GetProjectsResponse {
  getProjects: ProjectDto[];
}

export const getProjectsQuery = () => {
  return QUERY<GetProjectsResponse>({
    query: GET_PROJECTS,
    fetchPolicy: 'network-only',
  });
};
