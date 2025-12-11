import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesGtmService from '../../services/HypothesesGtmService';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createGtmPart = async ({
    projectHypothesisId,
    userId,
    promptPart,
}: {
    projectHypothesisId: string;
    userId: string;
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

        const prompt =
            prompts.createHypothesesGtm(projectHypothesis, promptPart);
        const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
            JsonSchemaType.HYPOTHESES_GTM,
            prompt,
            project.assistantId,
            20000
        );
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;

        console.log('jsonData', jsonData);

        return await hypothesesGtmService.initHypothesesGtm({
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
