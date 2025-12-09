import { gql } from '@apollo/client';
import { MUTATE } from '@/config/apollo/client';

export const CHANGE_PROJECT_ASSISTANT = gql`
  mutation Mutation($input: ChangeProjectAssistantInput!) {
    changeProjectAssistant(input: $input)
  }
`;

export interface ChangeProjectAssistantInput {
  projectId: string;
  systemInstruction: string;
}

export interface ChangeProjectAssistantResponse {
  changeProjectAssistant: string;
}

export const changeProjectAssistantMutation = (input: { input: ChangeProjectAssistantInput }) => {
  return MUTATE<ChangeProjectAssistantResponse>({
    mutation: CHANGE_PROJECT_ASSISTANT,
    variables: input,
  });
};
