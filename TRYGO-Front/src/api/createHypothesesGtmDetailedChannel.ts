import { gql } from "@apollo/client";
import { MUTATE } from "@/config/apollo/client";

export interface CreateHypothesesGtmDetailedChannelInput {
  customerSegmentId?: string | null;
  hypothesesGtmChannelId?: string | null;
  projectHypothesisId?: string | null;
}

export interface ChannelPreparationTask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface ContentIdea {
  id: string;
  title: string;
  text: string;
}

export interface ActionPlanTask {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface ActionPlan {
  id: string;
  stageTitle: string;
  tasks: ActionPlanTask[];
  isCompleted: boolean;
}

export interface MetricAndKpi {
  id: string;
  key: string;
  value: string;
}

export interface HypothesesGtmDetailedChannel {
  id: string;
  userId: string;
  hypothesesGtmChannelId: string;
  customerSegmentId: string;
  channelStrategy: string;
  channelPreparationTasks: ChannelPreparationTask[];
  tools: string;
  resources: string;
  contentIdeas: ContentIdea[];
  actionPlan: ActionPlan[];
  metricsAndKpis: MetricAndKpi[];
}

const CREATE_HYPOTHESES_GTM_DETAILED_CHANNEL = gql`
  mutation CreateHypothesesGtmDetailedChannel(
    $input: CreateHypothesesGtmDetailedChannelInput!
  ) {
    createHypothesesGtmDetailedChannel(input: $input) {
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

export const createHypothesesGtmDetailedChannel = async (
  input: CreateHypothesesGtmDetailedChannelInput
): Promise<HypothesesGtmDetailedChannel> => {
  try {
    const { data } = await MUTATE<{
      createHypothesesGtmDetailedChannel: HypothesesGtmDetailedChannel;
    }>({
      mutation: CREATE_HYPOTHESES_GTM_DETAILED_CHANNEL,
      variables: { input },
    });

    if (!data?.createHypothesesGtmDetailedChannel) {
      throw new Error("Failed to create GTM detailed channel");
    }

    return data.createHypothesesGtmDetailedChannel;
  } catch (error) {
    throw error;
  }
};
