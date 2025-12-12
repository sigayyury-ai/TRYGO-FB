import { prompts } from '../constants/aIntelligence/prompts';
import {
    ChangeProjectHypothesisInput,
    ProjectHypotheses,
} from '../generated/graphql';
import ProjectHypothesisModel from '../models/ProjectHypothesisModel';
import { IProjectHypothesis } from '../types/IProjectHypothesis';
import { GenerateProjectHypothesisInput } from '../utils/socketIO/generateProjectHypothesis';
import chatGPTService from './ai/ChatGPTService';
import { JsonSchemaType } from '../types/ChatGPT/JsonSchemaTypes';

class ProjectHypothesesService {
    private model: typeof ProjectHypothesisModel = ProjectHypothesisModel;

    async getProjectHypotheses(projectId: string, userId: string) {
        try {
            // Try both string and ObjectId for projectId (MongoDB might store it as ObjectId)
            const mongoose = require('mongoose');
            let query: any = { userId };
            
            // Try to convert projectId to ObjectId, if it fails, use as string
            try {
                const projectObjectId = new mongoose.Types.ObjectId(projectId);
                query.projectId = { $in: [projectId, projectObjectId] };
            } catch {
                query.projectId = projectId;
            }
            
            const hypotheses = await this.model.find(query);
            // Removed verbose logging - only log errors
            return hypotheses;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getProjectHypothesisByIdWithCheck(
        id: string,
        userId: string
    ): Promise<IProjectHypothesis> {
        try {
            const projectHypothesis = await this.model.findOne({
                _id: id,
                userId,
            });
            if (!projectHypothesis) {
                throw new Error('Project hypothesis not found');
            }
            return projectHypothesis;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createProjectHypothesis(data: Partial<ProjectHypotheses>) {
        try {
            return await this.model.create(data);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createProjectHypotheses(
        assistantId: string,
        projectId: string,
        userId: string,
        isFirstProject: boolean
    ): Promise<{ hypotheses: IProjectHypothesis[], isError: boolean, errorMessage: string }> {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Starting for projectId: ${projectId}, userId: ${userId}`);
        console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Is first project: ${isFirstProject}`);

        try {
            const hypotheses = [];
            console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Generating prompt...`);
            const prompt = prompts.createProjectHypotheses(isFirstProject);
            
            console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Calling GPT to generate hypotheses...`);
            const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
                JsonSchemaType.PROJECT_HYPOTHESES,
                prompt,
                assistantId,
                20000
            );

            const hypothesesFromGPT = gptResponse?.response?.hypotheses || [];
            console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] GPT returned ${hypothesesFromGPT.length} hypotheses`);

            if (hypothesesFromGPT.length === 0) {
                console.error(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] ERROR: GPT returned no hypotheses`);
                return { 
                    hypotheses: [], 
                    isError: true, 
                    errorMessage: 'GPT returned no hypotheses' 
                };
            }

            console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Creating hypotheses in database...`);
            for (let i = 0; i < hypothesesFromGPT.length; i++) {
                const hypothesis = hypothesesFromGPT[i];
                try {
                    console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Creating hypothesis ${i + 1}/${hypothesesFromGPT.length}: ${hypothesis.title}`);
                    const createdHypothesis = await this.model.create({
                        userId,
                        title: hypothesis.title,
                        description: hypothesis.description,
                        projectId,
                    });
                    hypotheses.push(createdHypothesis);
                    console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Hypothesis ${i + 1} created: ${createdHypothesis._id.toString()}`);
                } catch (hypothesisError) {
                    console.error(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] ERROR: Failed to create hypothesis ${i + 1}:`, hypothesisError);
                    console.error(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] Hypothesis data:`, {
                        title: hypothesis.title,
                        descriptionLength: hypothesis.description?.length || 0,
                    });
                    // Continue with other hypotheses even if one fails
                }
            }

            if (hypotheses.length === 0) {
                console.error(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] ERROR: No hypotheses were created successfully`);
                return { 
                    hypotheses: [], 
                    isError: true, 
                    errorMessage: 'Failed to create any hypotheses in database' 
                };
            }

            console.log(`[${timestamp}] [ProjectHypothesesService.createProjectHypotheses] SUCCESS: Created ${hypotheses.length} hypotheses:`, {
                hypothesisIds: hypotheses.map(h => h._id.toString()),
                titles: hypotheses.map(h => h.title),
            });

            return { hypotheses, isError: false, errorMessage: '' };
        } catch (error) {
            const errorTimestamp = new Date().toISOString();
            console.error(`[${errorTimestamp}] [ProjectHypothesesService.createProjectHypotheses] ERROR: Failed to create project hypotheses for projectId: ${projectId}`);
            console.error(`[${errorTimestamp}] [ProjectHypothesesService.createProjectHypotheses] Error:`, error);
            console.error(`[${errorTimestamp}] [ProjectHypothesesService.createProjectHypotheses] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
            console.error(`[${errorTimestamp}] [ProjectHypothesesService.createProjectHypotheses] Error details:`, {
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorMessage: error instanceof Error ? error.message : String(error),
                assistantId,
                projectId,
                userId,
            });
            return { 
                hypotheses: [], 
                isError: true, 
                errorMessage: error instanceof Error ? error.message : 'Unknown error' 
            };
        }
    }

    async createProjectHypothesisBasedOnTitleAndDescription(
        input: GenerateProjectHypothesisInput,
        userId: string
    ) {
        try {
            return await this.model.create({
                userId,
                title: input.title,
                description: input.description,
                projectId: input.projectId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeProjectHypothesis(
        input: ChangeProjectHypothesisInput,
        userId: string
    ) {
        try {
            // Build update object with only provided fields
            const updateData: { title?: string; description?: string } = {};
            if (input.title !== undefined && input.title !== null) {
                updateData.title = input.title;
            }
            if (input.description !== undefined && input.description !== null) {
                updateData.description = input.description;
            }

            // If no fields to update, return the existing document
            if (Object.keys(updateData).length === 0) {
                const existing = await this.model.findOne({
                    _id: input.id,
                    userId,
                });
                if (!existing) {
                    throw new Error('Project hypothesis not found');
                }
                return existing;
            }

            const projectHypothesis = await this.model.findOneAndUpdate(
                {
                    _id: input.id,
                    userId,
                },
                updateData,
                {
                    new: true,
                }
            );
            if (!projectHypothesis) {
                throw new Error('Project hypothesis not found');
            }
            return projectHypothesis;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteProjectHypothesis(id: string, userId: string) {
        try {
            const deleted = await this.model.findOneAndDelete({
                _id: id,
                userId,
            });
            if (!deleted) {
                throw new Error('Project hypothesis not found');
            }
            return deleted;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const projectHypothesesService = new ProjectHypothesesService();
export default projectHypothesesService;
