import { prompts } from '../constants/aIntelligence/prompts';
import { ProjectStartType } from '../generated/graphql';
import ProjectModel from '../models/ProjectModel';
import { IProject } from '../types/IProject';
import { getTextContentFromWebsite } from '../utils/getTextContentFromWebsite';
import { GenerateProjectInput } from '../utils/socketIO/generateProject';
import chatGPTService from './ai/ChatGPTService';

class ProjectService {
    private model: typeof ProjectModel = ProjectModel;

    async getProjectById(projectId: string, userId: string): Promise<IProject> {
        try {
            const project = await this.model.findOne({
                _id: projectId,
                userId,
            });
            if (!project) {
                throw new Error('Project not found');
            }
            return project;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getProjects(userId: string): Promise<IProject[]> {
        try {
            const projects = await this.model.find({ userId });
            console.log(`[ProjectService] getProjects for userId: ${userId}, found ${projects.length} projects`);
            projects.forEach((p, i) => {
                console.log(`[ProjectService]   ${i + 1}. ${p.title} (ID: ${p._id})`);
            });
            return projects;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async createProject(
        input: GenerateProjectInput,
        userId: string
    ): Promise<{ project: IProject | null, isError: boolean, errorMessage: string }> {
        try {
            let projectInfo;
            if (input.startType === ProjectStartType.UrlImport && input.url) {
                const informationFromWebsite = await getTextContentFromWebsite(
                    input.url
                );
                projectInfo = `Project info: ${input.info}, information from website: ${informationFromWebsite}`;
            } else {
                projectInfo = input.info;
            }

            const prompt = prompts.aggregateProjectAssistantInfo(projectInfo);
            const { instructions, projectTitle } =
                await chatGPTService.createAnswerWithSmartVersion(prompt);

            const assistantId = await chatGPTService.createAssistant(
                instructions,
                userId
            );

            const project = await this.model.create({
                userId,
                title: projectTitle,
                startType: input.startType,
                info: input.info,
                url: input.url,
                assistantId,
            });

            return { project, isError: false, errorMessage: '' };
        } catch (error) {
            console.error(error);
            return { project: null, isError: true, errorMessage: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async checkIfFirstProject(userId: string): Promise<boolean> {
        try {
            const projects = await this.model.find({ userId });
            return projects.length === 0;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
const projectService = new ProjectService();
export default projectService;
