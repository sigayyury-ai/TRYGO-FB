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
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [ProjectService.createProject] Starting for userId: ${userId}`);
        console.log(`[${timestamp}] [ProjectService.createProject] Input:`, {
            startType: input.startType,
            infoLength: input.info?.length || 0,
            hasUrl: !!input.url,
        });

        try {
            let projectInfo;
            if (input.startType === ProjectStartType.UrlImport && input.url) {
                console.log(`[${timestamp}] [ProjectService.createProject] Importing from URL: ${input.url}`);
                const informationFromWebsite = await getTextContentFromWebsite(
                    input.url
                );
                projectInfo = `Project info: ${input.info}, information from website: ${informationFromWebsite}`;
                console.log(`[${timestamp}] [ProjectService.createProject] Website content retrieved, length: ${informationFromWebsite?.length || 0}`);
            } else {
                projectInfo = input.info;
                console.log(`[${timestamp}] [ProjectService.createProject] Using provided info (no URL import)`);
            }

            console.log(`[${timestamp}] [ProjectService.createProject] Generating project assistant info...`);
            const prompt = prompts.aggregateProjectAssistantInfo(projectInfo);
            const { instructions, projectTitle } =
                await chatGPTService.createAnswerWithSmartVersion(prompt);
            console.log(`[${timestamp}] [ProjectService.createProject] Project title generated: ${projectTitle}`);
            console.log(`[${timestamp}] [ProjectService.createProject] Instructions length: ${instructions?.length || 0}`);

            console.log(`[${timestamp}] [ProjectService.createProject] Creating assistant...`);
            const assistantId = await chatGPTService.createAssistant(
                instructions,
                userId
            );
            console.log(`[${timestamp}] [ProjectService.createProject] Assistant created: ${assistantId}`);

            console.log(`[${timestamp}] [ProjectService.createProject] Creating project in database...`);
            const project = await this.model.create({
                userId,
                title: projectTitle,
                startType: input.startType,
                info: input.info,
                url: input.url,
                assistantId,
            });

            console.log(`[${timestamp}] [ProjectService.createProject] SUCCESS: Project created:`, {
                projectId: project._id.toString(),
                title: project.title,
                assistantId: project.assistantId,
            });

            return { project, isError: false, errorMessage: '' };
        } catch (error) {
            const errorTimestamp = new Date().toISOString();
            console.error(`[${errorTimestamp}] [ProjectService.createProject] ERROR: Failed to create project for userId: ${userId}`);
            console.error(`[${errorTimestamp}] [ProjectService.createProject] Error:`, error);
            console.error(`[${errorTimestamp}] [ProjectService.createProject] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
            console.error(`[${errorTimestamp}] [ProjectService.createProject] Error details:`, {
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            return { 
                project: null, 
                isError: true, 
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
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

    async updateAssistantId(projectId: string, userId: string, newAssistantId: string): Promise<IProject> {
        try {
            const project = await this.model.findOneAndUpdate(
                { _id: projectId, userId },
                { assistantId: newAssistantId },
                { new: true }
            );
            if (!project) {
                throw new Error('Project not found');
            }
            console.log(`[ProjectService] Updated assistantId for project ${projectId}: ${newAssistantId}`);
            return project;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
const projectService = new ProjectService();
export default projectService;
