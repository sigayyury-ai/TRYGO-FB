import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesValidationService from '../../services/HypothesesValidationService';
import projectService from '../../services/ProjectService';
import { CreateMessageInput } from './createMessage';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createValidationMessage = async (
    input: CreateMessageInput,
    userId: string
) => {
    try {
        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );
        const hypothesesValidation = await hypothesesValidationService.getHypothesesValidationWithCheck(
            input.projectHypothesisId,
            userId
        );

        const prompt = prompts.createValidationMessage(
            input.message,
            hypothesesValidation,
            input.wantToChangeInfo
        );

        const aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
            JsonSchemaType.VALIDATION_MESSAGE,
            prompt,
            project.assistantId,
            hypothesesValidation.threadId,
            20000,
            { 
                wantToChangeInfo: input.wantToChangeInfo,
                hasSummaryInterview: hypothesesValidation.summaryInterview ? true : false
            }
        );

        if (input.wantToChangeInfo) {
            await hypothesesValidationService.changeHypothesesValidation(
                {
                    id: hypothesesValidation._id.toString(),
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
