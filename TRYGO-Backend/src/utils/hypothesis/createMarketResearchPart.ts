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
        console.log('[createMarketResearchPart] Starting market research creation:', {
            projectHypothesisId,
            userId,
            hasPromptPart: !!promptPart
        });
        
        console.log('[createMarketResearchPart] Checking generation permissions...');
        await checkIfGenerationAllowed(userId, GenerationType.MARKET_RESEARCH);
        console.log('[createMarketResearchPart] Generation allowed');
        
        console.log('[createMarketResearchPart] Getting project hypothesis...');
        const projectHypothesis =
            await projectHypothesesService.getProjectHypothesisByIdWithCheck(
                projectHypothesisId,
                userId
            );
        console.log('[createMarketResearchPart] Project hypothesis found:', {
            id: projectHypothesis._id.toString(),
            projectId: projectHypothesis.projectId.toString()
        });
        
        console.log('[createMarketResearchPart] Getting project...');
        let project = await projectService.getProjectById(
            projectHypothesis.projectId.toString(),
            userId
        );
        console.log('[createMarketResearchPart] Project found:', {
            id: project._id.toString(),
            assistantId: project.assistantId
        });

        // Validate and migrate assistantId if needed
        console.log('[createMarketResearchPart] Validating and migrating assistantId...');
        const validAssistantId = await validateAndMigrateAssistantId(project, userId);
        console.log('[createMarketResearchPart] Valid assistantId:', validAssistantId);
        
        // If migration happened, get updated project
        if (validAssistantId !== project.assistantId) {
            console.log('[createMarketResearchPart] AssistantId was migrated, fetching updated project');
            project = await projectService.getProjectById(
                projectHypothesis.projectId.toString(),
                userId
            );
        }

        console.log('[createMarketResearchPart] Creating prompt...');
        const prompt = prompts.createHypothesesMarketResearch(
            projectHypothesis,
            promptPart
        );
        console.log('[createMarketResearchPart] Prompt created, length:', prompt.length);
        
        console.log('[createMarketResearchPart] Calling GPT API with assistantId:', validAssistantId);
        const gptResponse =
            await chatGPTService.createAnswerWithAssistantJsonSchema(
                JsonSchemaType.HYPOTHESES_MARKET_RESEARCH,
                prompt,
                validAssistantId,
                20000
            );
        console.log('[createMarketResearchPart] GPT response received');
        
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;
        console.log('[createMarketResearchPart] Thread ID:', threadId);
        console.log('[createMarketResearchPart] JSON data keys:', Object.keys(jsonData || {}));

        console.log('[createMarketResearchPart] Initializing market research in database...');
        const result = await hypothesesMarketResearchService.initHypothesesMarketResearch(
            {
                ...jsonData,
                projectHypothesisId: projectHypothesis._id.toString(),
                threadId,
                userId,
                id: '',
            }
        );
        
        console.log('[createMarketResearchPart] Market research created successfully:', {
            id: result._id.toString()
        });
        
        return result;
    } catch (error) {
        console.error('[createMarketResearchPart] Error:', error);
        if (error instanceof Error) {
            console.error('[createMarketResearchPart] Error message:', error.message);
            console.error('[createMarketResearchPart] Error stack:', error.stack);
        }
        throw error;
    }
};
