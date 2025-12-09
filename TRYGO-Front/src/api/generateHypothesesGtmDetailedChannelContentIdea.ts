import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { ContentIdea } from "./createHypothesesGtmDetailedChannel";

export interface GenerateHypothesesGtmDetailedChannelContentIdeaInput {
  customerSegmentId?: string | null;
  hypothesesGtmChannelId?: string | null;
}

const GENERATE_HYPOTHESES_GTM_DETAILED_CHANNEL_CONTENT_IDEA = gql`
  mutation GenerateHypothesesGtmDetailedChannelContentIdea(
    $input: GenerateHypothesesGtmDetailedChannelContentIdeaInput!
  ) {
    generateHypothesesGtmDetailedChannelContentIdea(input: $input) {
      id
      title
      text
    }
  }
`;

export const generateHypothesesGtmDetailedChannelContentIdea = async (
  input: GenerateHypothesesGtmDetailedChannelContentIdeaInput
): Promise<ContentIdea> => {
  try {
    const { data } = await MUTATE<{
      generateHypothesesGtmDetailedChannelContentIdea: ContentIdea;
    }>({
      mutation: GENERATE_HYPOTHESES_GTM_DETAILED_CHANNEL_CONTENT_IDEA,
      variables: { input },
    });

    if (!data?.generateHypothesesGtmDetailedChannelContentIdea) {
      throw new Error("Failed to generate content idea");
    }

    return data.generateHypothesesGtmDetailedChannelContentIdea;
  } catch (error) {
    throw error;
  }
};
