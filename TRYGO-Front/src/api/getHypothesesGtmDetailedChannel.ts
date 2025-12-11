import { gql } from "@apollo/client";
import { QUERY } from "@/config/apollo/client";
import { HypothesesGtmDetailedChannel } from "./createHypothesesGtmDetailedChannel";

export interface GetHypothesesGtmDetailedChannelInput {
  customerSegmentId?: string | null;
  hypothesesGtmChannelId?: string | null;
}

const GET_HYPOTHESES_GTM_DETAILED_CHANNEL = gql`
  query GetHypothesesGtmDetailedChannel($input: GetHypothesesGtmDetailedChannelInput!) {
    getHypothesesGtmDetailedChannel(input: $input) {
      id
      userId
      hypothesesGtmChannelId
      customerSegmentId
      channelStrategy
      channelPreparationTasks {
        id
        text
        isCompleted
      }
      tools
      resources
      contentIdeas {
        id
        title
        text
      }
      actionPlan {
        id
        stageTitle
        tasks {
          id
          text
          isCompleted
        }
        isCompleted
      }
      metricsAndKpis {
        id
        key
        value
      }
    }
  }
`;

export const getHypothesesGtmDetailedChannel = async (
  input: GetHypothesesGtmDetailedChannelInput
): Promise<HypothesesGtmDetailedChannel | null> => {
  try {
    const { data } = await QUERY<{
      getHypothesesGtmDetailedChannel: HypothesesGtmDetailedChannel;
    }>({
      query: GET_HYPOTHESES_GTM_DETAILED_CHANNEL,
      variables: { input },
      fetchPolicy: "cache-first",
    });

    return data?.getHypothesesGtmDetailedChannel || null;
  } catch (error) {
    return null;
  }
};
