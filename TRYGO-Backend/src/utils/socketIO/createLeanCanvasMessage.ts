import { prompts } from '../../constants/aIntelligence/prompts';
import chatGPTService from '../../services/ai/ChatGPTService';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import projectService from '../../services/ProjectService';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';
import { CreateMessageInput } from './createMessage';
import { JsonSchemaType } from '../../types/ChatGPT/JsonSchemaTypes';

export const createLeanCanvasMessage = async (
    input: CreateMessageInput,
    userId: string
) => {
    try {
        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );
        const hypothesesCore = await hypothesesCoreService.getHypothesesCore(
            input.projectHypothesisId,
            userId
        );

        // Get project hypothesis data (title, description)
        const projectHypothesis = await projectHypothesesService.getProjectHypothesisByIdWithCheck(
            input.projectHypothesisId,
            userId
        );

        // Get ICP profiles for all customer segments
        const icpProfiles = [];
        for (const segment of hypothesesCore.customerSegments) {
            try {
                if (segment._id) {
                    const icpProfile = await hypothesesPersonProfileService.getPersonProfileByCustomerSegmentId(
                        segment._id.toString(),
                        userId
                    );
                    if (icpProfile) {
                        icpProfiles.push({
                            segmentName: segment.name,
                            segmentDescription: segment.description,
                            profile: icpProfile,
                        });
                    }
                }
            } catch (error) {
                // ICP profile might not exist for this segment, skip it
                console.log(`[createLeanCanvasMessage] No ICP profile found for segment: ${segment.name}`);
            }
        }

        const prompt = prompts.createLeanCanvasMessage(
            input.message,
            hypothesesCore,
            input.wantToChangeInfo,
            projectHypothesis,
            icpProfiles
        );

        let aiResponse;
        try {
            aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
                JsonSchemaType.LEAN_CANVAS_MESSAGE,
                prompt,
                project.assistantId,
                hypothesesCore.threadId,
                20000,
                { wantToChangeInfo: input.wantToChangeInfo }
            );
        } catch (error: any) {
            // If thread not found, create a new one and try again
            if (error?.status === 404 && (error?.message?.includes('No thread found') || error?.message?.includes('thread'))) {
                console.log('[createLeanCanvasMessage] Thread not found, creating new thread...');
                const newThread = await chatGPTService.createThread();
                
                // Update hypothesesCore with new threadId
                const newHypothesesCore = {
                    ...hypothesesCore.toObject(),
                    threadId: newThread.id,
                    id: hypothesesCore._id.toString(),
                };
                await hypothesesCoreService.changeHypothesesCore(newHypothesesCore, userId);
                
                // Retry with new thread
                aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
                    JsonSchemaType.LEAN_CANVAS_MESSAGE,
                    prompt,
                    project.assistantId,
                    newThread.id,
                    20000,
                    { wantToChangeInfo: input.wantToChangeInfo }
                );
            } else if (error?.status === 404 && error?.message?.includes('No assistant found')) {
                // If assistant not found, create a new one
                console.log('[createLeanCanvasMessage] Assistant not found, creating new assistant...');
                const assistantInstructions = 'You are a helpful assistant for creating and refining Lean Canvas business models.';
                const newAssistantId = await chatGPTService.createAssistant(assistantInstructions, userId);
                
                // Update project with new assistantId (if needed - might require projectService method)
                // For now, just create new thread and retry
                const newThread = hypothesesCore.threadId 
                    ? await chatGPTService.createThread() 
                    : { id: hypothesesCore.threadId };
                
                if (!hypothesesCore.threadId) {
                    const newHypothesesCore = {
                        ...hypothesesCore.toObject(),
                        threadId: newThread.id,
                        id: hypothesesCore._id.toString(),
                    };
                    await hypothesesCoreService.changeHypothesesCore(newHypothesesCore, userId);
                }
                
                // Retry with new assistant
                aiResponse = await chatGPTService.createAnswerWithThreadJsonSchema(
                    JsonSchemaType.LEAN_CANVAS_MESSAGE,
                    prompt,
                    newAssistantId,
                    newThread.id,
                    20000,
                    { wantToChangeInfo: input.wantToChangeInfo }
                );
            } else {
                throw error;
            }
        }

        if (input.wantToChangeInfo) {
            for (const newCustomerSegment of aiResponse.response
                .customerSegments) {
                const existingCustomerSegment =
                    hypothesesCore.customerSegments.find(
                        (customerSegment) =>
                            customerSegment.name === newCustomerSegment.name
                    );
                if (existingCustomerSegment) {
                    newCustomerSegment.id =
                        existingCustomerSegment._id.toString();
                }
            }
            const newHypothesesCore = {
                ...hypothesesCore.toObject(),
                ...aiResponse.response,
                id: hypothesesCore._id.toString(),
            };
            await hypothesesCoreService.changeHypothesesCore(
                newHypothesesCore,
                userId
            );
        }

        return aiResponse.response.message;
    } catch (error) {
        console.error(error);
    }
};
