import { ChangeProjectAssistantInput } from '../generated/graphql';
import ProjectAssistantModel from '../models/ProjectAssistantModel';
import { IProjectAssistant } from '../types/IProjectAssistant';
import chatGPTService from './ai/ChatGPTService';
import projectService from './ProjectService';

class ProjectAssistantService {
    private model: typeof ProjectAssistantModel = ProjectAssistantModel;

    async getProjectAssistant(
        projectId: string,
        userId: string
    ): Promise<IProjectAssistant> {
        try {
            const projectAssistant = await this.model.findOne({
                projectId,
                userId,
            });
            if (!projectAssistant) {
                const project = await projectService.getProjectById(
                    projectId,
                    userId
                );
                const assistent = await chatGPTService.getAssistant(
                    project.assistantId
                );
                if (!assistent) {
                    throw new Error(
                        'Assistant not found, please contact support'
                    );
                }
                return await this.model.create({
                    projectId,
                    userId,
                    systemInstruction: assistent.instructions,
                });
            }
            return projectAssistant;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async changeProjectAssistant(
        input: ChangeProjectAssistantInput,
        userId: string
    ) {
        try {
            const project = await projectService.getProjectById(
                input.projectId,
                userId
            );
            const assistent = await chatGPTService.changeAssistant(
                project.assistantId,
                input.systemInstruction
            );
            if (!assistent) {
                throw new Error('Assistant not found, please contact support');
            }

            const projectAssistant = await this.model.findOneAndUpdate(
                { projectId: input.projectId, userId },
                { systemInstruction: assistent.instructions },
                { new: true }
            );
            if (!projectAssistant) {
                throw new Error('Project assistant not found');
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //TODO: change assistant

    async createProjectAssistant(projectId: string, systemInstruction: string) {
        return await this.model.create({ projectId, systemInstruction });
    }
}
const projectAssistantService = new ProjectAssistantService();
export default projectAssistantService;
