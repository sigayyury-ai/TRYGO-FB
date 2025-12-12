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
            console.log(`[ProjectHypothesesService] getProjectHypotheses for projectId: ${projectId}, userId: ${userId}, found ${hypotheses.length} hypotheses`);
            hypotheses.forEach((h, i) => {
                console.log(`[ProjectHypothesesService]   ${i + 1}. ${h.title} (ID: ${h._id})`);
            });
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
        try {
            const hypotheses = [];
            const prompt = prompts.createProjectHypotheses(isFirstProject);
            const gptResponse = await chatGPTService.createAnswerWithAssistantJsonSchema(
                JsonSchemaType.PROJECT_HYPOTHESES,
                prompt,
                assistantId,
                20000
            );

            for (const hypothesis of gptResponse.response.hypotheses) {
                const createdHypothesis = await this.model.create({
                    userId,
                    title: hypothesis.title,
                    description: hypothesis.description,
                    projectId,
                });
                hypotheses.push(createdHypothesis);
            }
            return { hypotheses, isError: false, errorMessage: '' } ;
        } catch (error) {
            console.error(error);
            return { hypotheses: [], isError: true, errorMessage: error instanceof Error ? error.message : 'Unknown error' };
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
