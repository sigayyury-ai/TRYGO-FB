import { gql } from '@apollo/client';
import { QUERY } from '@/config/apollo/client';

export const GET_PROJECT_ASSISTANT = gql`
  query GetProjectAssistant($projectId: ID!) {
    getProjectAssistant(projectId: $projectId) {
      id
      userId
      projectId
      systemInstruction
    }
  }
`;

export interface ProjectAssistant {
  id: string;
  userId: string;
  projectId: string;
  systemInstruction: string;
}

export interface GetProjectAssistantResponse {
  getProjectAssistant: ProjectAssistant;
}

export const getProjectAssistantQuery = (projectId: string) => {
  return QUERY<GetProjectAssistantResponse>({
    query: GET_PROJECT_ASSISTANT,
    variables: { projectId },
    fetchPolicy: 'network-only',
  });
};
