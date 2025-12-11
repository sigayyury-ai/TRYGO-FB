import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesPackingService from '../../services/HypothesesPackingService';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';
import {
    checkIfGenerationAllowed,
    GenerationType,
} from '../subscription/checkIfGenerationAllowed';

export const createPackingPart = async ({
    projectHypothesisId,
    userId,
    promptPart,
}: {
    projectHypothesisId: string;
    userId: string;
    promptPart?: string;
}) => {
    try {
        await checkIfGenerationAllowed(userId, GenerationType.PACKING);

        const projectHypothesis =
            await projectHypothesesService.getProjectHypothesisByIdWithCheck(
                projectHypothesisId,
                userId
            );
        const project = await projectService.getProjectById(
            projectHypothesis.projectId.toString(),
            userId
        );

        const prompt = prompts.createHypothesesPacking(
            projectHypothesis,
            promptPart
        );
        console.log('prompt', prompt);
        const gptResponse =
            await chatGPTService.createAnswerWithAssistantJsonSchema(
                JsonSchemaType.HYPOTHESES_PACKING,
                prompt,
                project.assistantId,
                20000
            );
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;

        return await hypothesesPackingService.initHypothesesPacking({
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
