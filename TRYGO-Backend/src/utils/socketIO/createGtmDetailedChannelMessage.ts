import { prompts } from '../../constants/aIntelligence/prompts';
import { GetHypothesesGtmDetailedChannelInput } from '../../generated/graphql';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesGtmDetailedChannelService from '../../services/HypothesesGtmDetailedChannelService';
import hypothesesGtmService from '../../services/HypothesesGtmService';
import projectService from '../../services/ProjectService';
import { CreateMessageInput } from './createMessage';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createGtmDetailedChannelMessage = async (
    input: CreateMessageInput,
    userId: string
) => {
    try {
        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );
        if (!input.customerSegmentId) {
            throw new Error(
                'For this action you must specify customerSegmentId'
            );
        }
        const hypothesesGtmDetailedChannel =
            await hypothesesGtmDetailedChannelService.getHypothesesGtmDetailedChannelWithCheck(
                input as GetHypothesesGtmDetailedChannelInput,
                userId
            );

        const prompt = prompts.createGtmDetailedChannelMessage(
            input.message,
            hypothesesGtmDetailedChannel,
            input.wantToChangeInfo
        );

        const hypothesesGtm =
            await hypothesesGtmService.getHypothesesGtmWithCheck(
                input.projectHypothesisId,
                userId
            );

        const aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
            JsonSchemaType.GTM_DETAILED_CHANNEL_MESSAGE,
            prompt,
            project.assistantId,
            hypothesesGtm.threadId,
            20000,
            { wantToChangeInfo: input.wantToChangeInfo }
        );

        if (input.wantToChangeInfo) {
            await hypothesesGtmDetailedChannelService.changeHypothesesGtmDetailedChannel(
                {
                    id: hypothesesGtmDetailedChannel._id.toString(),
                    ...aiResponse.response,
                },
                userId
            );
        }

        return aiResponse.response.message;
    } catch (error) {
        console.error(error);
    }
};
