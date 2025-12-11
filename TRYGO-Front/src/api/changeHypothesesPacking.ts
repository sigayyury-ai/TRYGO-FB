import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";

export const CHANGE_HYPOTHESES_PACKING = gql`
  mutation ChangeHypothesesPacking($input: ChangeHypothesesPackingInput!) {
    changeHypothesesPacking(input: $input) {
      id
      userId
      projectHypothesisId
      threadId
      summary
    }
  }
`;

export interface ChangeHypothesesPackingInput {
  id: string;
  summary: string;
}

export interface HypothesesPackingDto {
  id: string;
  userId: string;
  projectHypothesisId: string;
  threadId: string;
  summary: string;
}

export interface ChangeHypothesisPackingResponse {
  changeHypothesesPacking: HypothesesPackingDto;
}

export const changeHypothesesPackingMutation = (variables: {
  input: ChangeHypothesesPackingInput;
}) => {
  return MUTATE<ChangeHypothesisPackingResponse>({
    mutation: CHANGE_HYPOTHESES_PACKING,
    variables,
  });
};
