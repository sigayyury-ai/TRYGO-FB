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
            return await this.model.find({ projectId, userId });
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
            const projectHypothesis = await this.model.findOneAndUpdate(
                {
                    _id: input.id,
                    userId,
                },
                {
                    title: input.title,
                    description: input.description,
                },
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
            return await this.model.findOneAndDelete({
                _id: id,
                userId,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

const projectHypothesesService = new ProjectHypothesesService();
export default projectHypothesesService;
