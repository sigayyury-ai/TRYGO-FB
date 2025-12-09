import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";
import { 
  HypothesesGtmDetailedChannel,
  ChannelPreparationTask,
  ContentIdea,
  ActionPlan,
  ActionPlanTask,
  MetricAndKpi
} from "./createHypothesesGtmDetailedChannel";

export interface ChangeHypothesesGtmDetailedChannelInput {
  id: string;
  channelStrategy?: string | null;
  channelPreparationTasks?: ChannelPreparationTaskInput[] | null;
  tools?: string | null;
  resources?: string | null;
  contentIdeas?: ContentIdeaInput[] | null;
  actionPlan?: ActionPlanInput[] | null;
  metricsAndKpis?: MetricAndKpiInput[] | null;
}

export interface ChannelPreparationTaskInput {
  id?: string | null;
  text?: string | null;
  isCompleted?: boolean | null;
}

export interface ContentIdeaInput {
  id?: string | null;
  title?: string | null;
  text?: string | null;
}

export interface ActionPlanTaskInput {
  id?: string | null;
  text?: string | null;
  isCompleted?: boolean | null;
}

export interface ActionPlanInput {
  id?: string | null;
  stageTitle?: string | null;
  tasks?: ActionPlanTaskInput[] | null;
  isCompleted?: boolean | null;
}

export interface MetricAndKpiInput {
  id?: string | null;
  key?: string | null;
  value?: string | null;
}

const CHANGE_HYPOTHESES_GTM_DETAILED_CHANNEL = gql`
  mutation ChangeHypothesesGtmDetailedChannel(
    $input: ChangeHypothesesGtmDetailedChannelInput!
  ) {
    changeHypothesesGtmDetailedChannel(input: $input) {
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

export const changeHypothesesGtmDetailedChannel = async (
  input: ChangeHypothesesGtmDetailedChannelInput
): Promise<HypothesesGtmDetailedChannel> => {
  try {
    const { data } = await MUTATE<{
      changeHypothesesGtmDetailedChannel: HypothesesGtmDetailedChannel;
    }>({
      mutation: CHANGE_HYPOTHESES_GTM_DETAILED_CHANNEL,
      variables: { input },
    });

    if (!data?.changeHypothesesGtmDetailedChannel) {
      throw new Error("Failed to update GTM detailed channel");
    }

    return data.changeHypothesesGtmDetailedChannel;
  } catch (error) {
    throw error;
  }
};
