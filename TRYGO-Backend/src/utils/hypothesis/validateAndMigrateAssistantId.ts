import chatGPTService from '../../services/ai/ChatGPTService';
import projectService from '../../services/ProjectService';
import projectAssistantService from '../../services/ProjectAssistantService';
import ProjectAssistantModel from '../../models/ProjectAssistantModel';

/**
 * Attempts to retrieve original assistant instructions from multiple sources
 * Priority: 1. OpenAI API (old assistant), 2. Database (ProjectAssistant), 3. Default
 */
const getOriginalInstructions = async (
    oldAssistantId: string,
    projectId: string,
    userId: string,
    projectTitle: string
): Promise<string> => {
    // Try 1: Get from OpenAI API (if old assistant still exists)
    // Skip this for old format IDs (assistant_*) as they are invalid
    if (!oldAssistantId.startsWith('assistant_')) {
        try {
            const oldAssistant = await chatGPTService.getAssistant(oldAssistantId);
            if (oldAssistant && oldAssistant.instructions) {
                return oldAssistant.instructions;
            }
        } catch (error) {
            // Silent fail, try next source
        }
    }

    // Try 2: Get from Database (ProjectAssistant collection)
    try {
        const projectAssistant = await projectAssistantService.getProjectAssistant(projectId, userId);
        if (projectAssistant && projectAssistant.systemInstruction) {
            return projectAssistant.systemInstruction;
        }
    } catch (error) {
        // Silent fail, use fallback
    }

    // Fallback: Use default instructions with warning
    console.warn(`[validateAndMigrateAssistantId] Could not retrieve original instructions. Using default instructions. Original assistant instructions may be lost.`);
    return `You are a project assistant for the project "${projectTitle}". 
Help the user with marketing tasks and provide accurate, helpful responses based on the project information.`;
};

/**
 * Validates and migrates assistantId if it's in old format
 * Old format: assistant_* (e.g., assistant_1765319658006_1)
 * New format: asst_* (e.g., asst_abc123)
 * 
 * IMPORTANT: Preserves original assistant instructions when migrating
 * 
 * @param project - Project object with assistantId
 * @param userId - User ID for creating new assistant
 * @returns Valid assistantId (either original or newly created)
 */
export const validateAndMigrateAssistantId = async (
    project: { _id: any; assistantId: string; title: string },
    userId: string
): Promise<string> => {
    const assistantId = project.assistantId;
    
    // Check if assistantId is in old format (starts with "assistant_")
    if (assistantId && assistantId.startsWith('assistant_')) {
        try {
            // Get original instructions from multiple sources
            const originalInstructions = await getOriginalInstructions(
                assistantId,
                project._id.toString(),
                userId,
                project.title
            );
            
            // Create new assistant with original instructions
            const newAssistantId = await chatGPTService.createAssistant(
                originalInstructions,
                userId
            );
            
            // Update project with new assistantId
            await projectService.updateAssistantId(
                project._id.toString(),
                userId,
                newAssistantId
            );
            
            // Save instructions to ProjectAssistant collection for future reference
            try {
                let existingAssistant;
                try {
                    existingAssistant = await projectAssistantService.getProjectAssistant(
                        project._id.toString(),
                        userId
                    );
                } catch (error) {
                    existingAssistant = null;
                }
                
                if (existingAssistant) {
                    await ProjectAssistantModel.findOneAndUpdate(
                        { projectId: project._id, userId },
                        { systemInstruction: originalInstructions },
                        { new: true }
                    );
                } else {
                    await ProjectAssistantModel.create({
                        projectId: project._id,
                        userId,
                        systemInstruction: originalInstructions,
                    });
                }
            } catch (dbError) {
                console.warn(`[validateAndMigrateAssistantId] Could not save instructions to database:`, dbError);
                // Don't fail migration if DB save fails - assistant is already created
            }
            
            return newAssistantId;
        } catch (error) {
            console.error(`[validateAndMigrateAssistantId] Critical error migrating assistantId:`, error);
            throw new Error(
                `Failed to migrate assistant ID from old format. ` +
                `Please contact support or recreate the project. Original error: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
    
    // Validate that assistantId starts with "asst_" (new format)
    if (assistantId && !assistantId.startsWith('asst_')) {
        console.warn(`[validateAndMigrateAssistantId] AssistantId format is unexpected: ${assistantId}`);
        // Don't throw error, let OpenAI API handle it
    }
    
    return assistantId;
};
