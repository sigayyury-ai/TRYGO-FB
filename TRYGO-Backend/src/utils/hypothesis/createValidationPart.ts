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
import { validateAndMigrateAssistantId } from './validateAndMigrateAssistantId';

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
        console.log('[createValidationPart] Starting validation creation:', {
            projectHypothesisId,
            userId,
            hasPromptPart: !!promptPart
        });
        
        await checkIfGenerationAllowed(userId, GenerationType.VALIDATION);
        console.log('[createValidationPart] Generation allowed');
        
        const projectHypothesis = await projectHypothesesService.getProjectHypothesisByIdWithCheck(
            projectHypothesisId,
            userId
        );
        console.log('[createValidationPart] Project hypothesis found:', {
            id: projectHypothesis._id.toString(),
            projectId: projectHypothesis.projectId.toString()
        });
        
        let project = await projectService.getProjectById(
            projectHypothesis.projectId.toString(),
            userId
        );
        console.log('[createValidationPart] Project found:', {
            id: project._id.toString(),
            assistantId: project.assistantId
        });

        // Validate and migrate assistantId if needed
        console.log('[createValidationPart] Validating and migrating assistantId...');
        const validAssistantId = await validateAndMigrateAssistantId(project, userId);
        console.log('[createValidationPart] Valid assistantId:', validAssistantId);
        
        // If migration happened, get updated project
        if (validAssistantId !== project.assistantId) {
            console.log('[createValidationPart] AssistantId was migrated, fetching updated project');
            project = await projectService.getProjectById(
                projectHypothesis.projectId.toString(),
                userId
            );
        }

        console.log('[createValidationPart] Creating prompt...');
        const prompt =
            prompts.createHypothesesValidation(projectHypothesis, promptPart);
        
        console.log('[createValidationPart] Calling GPT with assistantId:', validAssistantId);
        const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
            JsonSchemaType.HYPOTHESES_VALIDATION,
            prompt,
            validAssistantId,
            20000
        );
        console.log('[createValidationPart] GPT response received');
        
        const jsonData = gptResponse.response.response;
        const threadId = gptResponse.threadId;
        console.log('[createValidationPart] Thread ID:', threadId);

        console.log('[createValidationPart] Initializing validation in database...');
        const result = await hypothesesValidationService.initHypothesesValidation({
            ...jsonData,
            projectHypothesisId: projectHypothesis._id.toString(),
            threadId,
            userId,
            id: '',
        });
        
        console.log('[createValidationPart] Validation created successfully:', {
            id: result._id.toString()
        });
        
        return result;
    } catch (error) {
        console.error('[createValidationPart] Error:', error);
        if (error instanceof Error) {
            console.error('[createValidationPart] Error message:', error.message);
            console.error('[createValidationPart] Error stack:', error.stack);
        }
        throw error;
    }
};
