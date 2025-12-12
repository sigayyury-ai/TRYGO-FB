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
            console.log(`[validateAndMigrateAssistantId] Attempting to retrieve instructions from OpenAI API for: ${oldAssistantId}`);
            const oldAssistant = await chatGPTService.getAssistant(oldAssistantId);
            if (oldAssistant && oldAssistant.instructions) {
                console.log(`[validateAndMigrateAssistantId] ✅ Successfully retrieved instructions from OpenAI API`);
                return oldAssistant.instructions;
            }
        } catch (error) {
            console.warn(`[validateAndMigrateAssistantId] Could not retrieve from OpenAI API:`, error instanceof Error ? error.message : String(error));
        }
    } else {
        console.log(`[validateAndMigrateAssistantId] Skipping OpenAI API retrieval for old format assistant ID: ${oldAssistantId}`);
    }

    // Try 2: Get from Database (ProjectAssistant collection)
    try {
        console.log(`[validateAndMigrateAssistantId] Attempting to retrieve instructions from database...`);
        const projectAssistant = await projectAssistantService.getProjectAssistant(projectId, userId);
        if (projectAssistant && projectAssistant.systemInstruction) {
            console.log(`[validateAndMigrateAssistantId] ✅ Successfully retrieved instructions from database`);
            return projectAssistant.systemInstruction;
        }
    } catch (error) {
        console.warn(`[validateAndMigrateAssistantId] Could not retrieve from database:`, error instanceof Error ? error.message : String(error));
    }

    // Fallback: Use default instructions with warning
    console.warn(`[validateAndMigrateAssistantId] ⚠️ Could not retrieve original instructions. Using default instructions.`);
    console.warn(`[validateAndMigrateAssistantId] Original assistant instructions may be lost.`);
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
        console.log(`[validateAndMigrateAssistantId] Detected old assistantId format: ${assistantId}`);
        console.log(`[validateAndMigrateAssistantId] Starting migration with instruction preservation...`);
        
        try {
            // Get original instructions from multiple sources
            const originalInstructions = await getOriginalInstructions(
                assistantId,
                project._id.toString(),
                userId,
                project.title
            );
            
            console.log(`[validateAndMigrateAssistantId] Creating new assistant with preserved instructions...`);
            console.log(`[validateAndMigrateAssistantId] Instructions length: ${originalInstructions.length} characters`);
            
            // Create new assistant with original instructions
            const newAssistantId = await chatGPTService.createAssistant(
                originalInstructions,
                userId
            );
            
            console.log(`[validateAndMigrateAssistantId] ✅ New assistant created: ${newAssistantId}`);
            
            // Update project with new assistantId
            await projectService.updateAssistantId(
                project._id.toString(),
                userId,
                newAssistantId
            );
            
            // Save instructions to ProjectAssistant collection for future reference
            try {
                // Try to get existing record
                let existingAssistant;
                try {
                    existingAssistant = await projectAssistantService.getProjectAssistant(
                        project._id.toString(),
                        userId
                    );
                } catch (error) {
                    // If not found, that's okay - we'll create new one
                    existingAssistant = null;
                }
                
                if (existingAssistant) {
                    // Update existing record
                    await ProjectAssistantModel.findOneAndUpdate(
                        { projectId: project._id, userId },
                        { systemInstruction: originalInstructions },
                        { new: true }
                    );
                    console.log(`[validateAndMigrateAssistantId] ✅ Updated existing instructions in database`);
                } else {
                    // Create new record
                    await ProjectAssistantModel.create({
                        projectId: project._id,
                        userId,
                        systemInstruction: originalInstructions,
                    });
                    console.log(`[validateAndMigrateAssistantId] ✅ Created new instructions record in database`);
                }
            } catch (dbError) {
                console.warn(`[validateAndMigrateAssistantId] Could not save instructions to database:`, dbError);
                // Don't fail migration if DB save fails - assistant is already created
            }
            
            console.log(`[validateAndMigrateAssistantId] ✅ Project assistantId updated successfully`);
            console.log(`[validateAndMigrateAssistantId] Migration completed. Original instructions preserved.`);
            
            return newAssistantId;
        } catch (error) {
            console.error(`[validateAndMigrateAssistantId] ❌ Error migrating assistantId:`, error);
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
