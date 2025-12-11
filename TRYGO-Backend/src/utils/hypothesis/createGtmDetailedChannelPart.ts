import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import hypothesesGtmDetailedChannelService from '../../services/HypothesesGtmDetailedChannelService';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';
import hypothesesGtmService from '../../services/HypothesesGtmService';
import { IHypothesesGtmChannel } from '../../types/IHypothesesGtm';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createGtmDetailedChannelPart = async ({
    projectHypothesisId,
    userId,
    customerSegmentId,
    hypothesesGtmChannelId,
    promptPart,
}: {
    projectHypothesisId: string;
    userId: string;
    customerSegmentId: string;
    hypothesesGtmChannelId: string;
    promptPart?: string;
}) => {
    try {
        const projectHypothesis =
            await projectHypothesesService.getProjectHypothesisByIdWithCheck(
                projectHypothesisId,
                userId
            );
        const project = await projectService.getProjectById(
            projectHypothesis.projectId.toString(),
            userId
        );

        const hypothesesCore = await hypothesesCoreService.getHypothesesCore(
            projectHypothesisId,
            userId
        );
        console.log('hypothesesCore.customerSegments', hypothesesCore.customerSegments);
        const customerSegment = hypothesesCore.customerSegments.find(
            (segment) => segment.id === customerSegmentId
        );
        if (!customerSegment) {
            throw new Error('Customer segment not found');
        }
        const hypothesesGtm = await hypothesesGtmService.getHypothesesGtmWithCheck(
            projectHypothesisId,
            userId
        );
        
        // Search for channel in all three stages
        let channel = hypothesesGtm.stageValidate.channels.find(
            (channel) => channel.id === hypothesesGtmChannelId
        );
        
        if (!channel) {
            channel = hypothesesGtm.stageBuildAudience.channels.find(
                (channel) => channel.id === hypothesesGtmChannelId
            );
        }
        
        if (!channel) {
            channel = hypothesesGtm.stageScale.channels.find(
                (channel) => channel.id === hypothesesGtmChannelId
            );
        }
        
        if (!channel) {
            throw new Error('Channel not found in any stage');
        }
        // const channel = core.channels.find((channel) => channel.channelType === channelType);

        const prompt = prompts.createHypothesesGtmDetailedChannel(
            projectHypothesis,
            customerSegment,
            channel as IHypothesesGtmChannel,
            promptPart
        );
        const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
            JsonSchemaType.HYPOTHESES_GTM_DETAILED_CHANNEL,
            prompt,
            project.assistantId,
            20000
        );
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;

        console.log('jsonData', jsonData);

        return await hypothesesGtmDetailedChannelService.initHypothesesGtmDetailedChannel(
            {
                ...jsonData,
                projectHypothesisId: projectHypothesis._id.toString(),
                threadId,
                hypothesesGtmChannelId: hypothesesGtmChannelId,
                customerSegmentId: customerSegmentId,
                userId,
                id: '',
            }
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
};
