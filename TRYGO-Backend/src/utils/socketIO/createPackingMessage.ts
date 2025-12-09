import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesPackingService from '../../services/HypothesesPackingService';
import projectService from '../../services/ProjectService';
import { CreateMessageInput } from './createMessage';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createPackingMessage = async (
    input: CreateMessageInput,
    userId: string
) => {
    try {
        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );
        const hypothesesPacking = await hypothesesPackingService.getHypothesesPackingWithCheck(
            input.projectHypothesisId,
            userId
        );

        const prompt = prompts.createPackingMessage(
            input.message,
            hypothesesPacking,
            input.wantToChangeInfo
        );

        const aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
            JsonSchemaType.PACKING_MESSAGE,
            prompt,
            project.assistantId,
            hypothesesPacking.threadId,
            20000,
            { wantToChangeInfo: input.wantToChangeInfo }
        );

        if (input.wantToChangeInfo) {
            await hypothesesPackingService.changeHypothesesPacking(
                {
                    id: hypothesesPacking._id.toString(),
                    summary: aiResponse.response.summary,
                },
                userId
            );
        }

        return aiResponse.response.message;
    } catch (error) {
        console.error(error);
    }
};
