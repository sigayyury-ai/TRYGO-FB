import { Types } from 'mongoose';
import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';
import { IProjectHypothesis } from '../../types/IProjectHypothesis';
import hypothesesValidationService from '../../services/HypothesesValidationService';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';
import { checkIfGenerationAllowed, GenerationType } from '../subscription/checkIfGenerationAllowed';

export const createValidationPart = async ({
    projectHypothesisId,
    userId,
    promptPart,
}: {
    projectHypothesisId: string;
    userId: string;
    promptPart?: string;
}) => {
    try {
        await checkIfGenerationAllowed(userId, GenerationType.VALIDATION);
        
        const projectHypothesis = await projectHypothesesService.getProjectHypothesisByIdWithCheck(
            projectHypothesisId,
            userId
        );
        const project = await projectService.getProjectById(
            projectHypothesis.projectId.toString(),
            userId
        );

        const prompt =
            prompts.createHypothesesValidation(projectHypothesis, promptPart);
        const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
            JsonSchemaType.HYPOTHESES_VALIDATION,
            prompt,
            project.assistantId,
            20000
        );
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;

        return await hypothesesValidationService.initHypothesesValidation({
            ...jsonData,
            projectHypothesisId: projectHypothesis._id.toString(),
            threadId,
            userId,
            id: '',
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
};
