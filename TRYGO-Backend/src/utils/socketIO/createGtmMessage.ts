import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesGtmService from '../../services/HypothesesGtmService';
import projectService from '../../services/ProjectService';
import { CreateMessageInput } from './createMessage';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createGtmMessage = async (
    input: CreateMessageInput,
    userId: string
) => {
    try {
        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );
        const hypothesesGtm = await hypothesesGtmService.getHypothesesGtmWithCheck(
            input.projectHypothesisId,
            userId
        );

        const prompt = prompts.createGtmMessage(
            input.message,
            hypothesesGtm,
            input.wantToChangeInfo
        );

        const aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
            JsonSchemaType.GTM_MESSAGE,
            prompt,
            project.assistantId,
            hypothesesGtm.threadId,
            20000,
            { wantToChangeInfo: input.wantToChangeInfo }
        );

        if (input.wantToChangeInfo) {
            await hypothesesGtmService.changeHypothesesGtm(
                {
                    id: hypothesesGtm._id.toString(),
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
