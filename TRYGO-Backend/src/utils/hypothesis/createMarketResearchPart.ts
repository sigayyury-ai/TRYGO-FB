import { Types } from 'mongoose';
import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';
import { IProjectHypothesis } from '../../types/IProjectHypothesis';
import hypothesesMarketResearchService from '../../services/HypothesesMarketResearchService';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';
import {
    checkIfGenerationAllowed,
    GenerationType,
} from '../subscription/checkIfGenerationAllowed';
import { validateAndMigrateAssistantId } from './validateAndMigrateAssistantId';

export const createMarketResearchPart = async ({
    projectHypothesisId,
    userId,
    promptPart,
}: {
    projectHypothesisId: string;
    userId: string;
    promptPart?: string;
}) => {
    try {
        await checkIfGenerationAllowed(userId, GenerationType.MARKET_RESEARCH);
        
        const projectHypothesis =
            await projectHypothesesService.getProjectHypothesisByIdWithCheck(
                projectHypothesisId,
                userId
            );
        
        let project = await projectService.getProjectById(
            projectHypothesis.projectId.toString(),
            userId
        );

        // Validate and migrate assistantId if needed
        const validAssistantId = await validateAndMigrateAssistantId(project, userId);
        
        // If migration happened, get updated project
        if (validAssistantId !== project.assistantId) {
            project = await projectService.getProjectById(
                projectHypothesis.projectId.toString(),
                userId
            );
        }

        const prompt = prompts.createHypothesesMarketResearch(
            projectHypothesis,
            promptPart
        );
        
        const gptResponse =
            await chatGPTService.createAnswerWithAssistantJsonSchema(
                JsonSchemaType.HYPOTHESES_MARKET_RESEARCH,
                prompt,
                validAssistantId,
                20000
            );
        
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;

        const result = await hypothesesMarketResearchService.initHypothesesMarketResearch(
            {
                ...jsonData,
                projectHypothesisId: projectHypothesis._id.toString(),
                threadId,
                userId,
                id: '',
            }
        );
        
        return result;
    } catch (error) {
        console.error('[createMarketResearchPart] Critical error:', error);
        throw error;
    }
};
