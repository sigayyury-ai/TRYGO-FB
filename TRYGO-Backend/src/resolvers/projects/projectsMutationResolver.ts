import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import projectService from '../../services/ProjectService';
import { CreateProjectInput, Project, ProjectGenerationStatus } from '../../generated/graphql';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import { createHypothesesParts } from '../../utils/hypothesis/createHypothesesParts';
import userService from '../../services/UserService';
import { checkIfProjectGenerationAllowed } from '../../utils/subscription/checkIfProjectGenerationAllowed';

const projectsMutationResolver = {
    Mutation: {
        async createProject(
            _: unknown,
            { input }: { input: CreateProjectInput },
            context: IContext
        ): Promise<Project> {
            const timestamp = new Date().toISOString();
            const userId = context.userId;
            
            console.log(`[${timestamp}] [createProject] Starting project creation for userId: ${userId}`);
            console.log(`[${timestamp}] [createProject] Input:`, {
                startType: input.startType,
                infoLength: input.info?.length || 0,
                hasUrl: !!input.url,
            });

            try {
                if (!userId) {
                    console.error(`[${timestamp}] [createProject] ERROR: User not authenticated`);
                    throw new Error('User not authenticated');
                }

                // Check if project generation is allowed
                console.log(`[${timestamp}] [createProject] Checking if project generation is allowed...`);
                const projectGenerationCheck = await checkIfProjectGenerationAllowed(userId);
                if (!projectGenerationCheck.allowed) {
                    console.error(`[${timestamp}] [createProject] ERROR: Project generation not allowed for userId: ${userId}`);
                    console.error(`[${timestamp}] [createProject] Error message: ${projectGenerationCheck.errorMessage}`);
                    throw new Error(projectGenerationCheck.errorMessage || 'Project generation not allowed');
                }
                console.log(`[${timestamp}] [createProject] Project generation allowed`);

                // Mark that project generation has started
                console.log(`[${timestamp}] [createProject] Marking project generation as started...`);
                await userService.changeUser(userId, {
                    isProjectGenerationStarted: true,
                });

                // Check if this is the first project
                const isFirstProject = await projectService.checkIfFirstProject(userId);
                console.log(`[${timestamp}] [createProject] Is first project: ${isFirstProject}`);

                // Create the project
                console.log(`[${timestamp}] [createProject] Creating project...`);
                const result = await projectService.createProject(
                    {
                        startType: input.startType,
                        info: input.info,
                        url: input.url || undefined,
                    },
                    userId
                );

                if (result.isError || !result.project) {
                    console.error(`[${timestamp}] [createProject] ERROR: Failed to create project for userId: ${userId}`);
                    console.error(`[${timestamp}] [createProject] Error details:`, {
                        isError: result.isError,
                        hasProject: !!result.project,
                        errorMessage: result.errorMessage,
                    });
                    throw new Error(result.errorMessage || 'Failed to create project');
                }

                const project = result.project;
                console.log(`[${timestamp}] [createProject] Project created successfully:`, {
                    projectId: project._id.toString(),
                    title: project.title,
                    assistantId: project.assistantId,
                });

                // Generate project hypotheses
                console.log(`[${timestamp}] [createProject] Generating project hypotheses...`);
                const responseProjectHypotheses =
                    await projectHypothesesService.createProjectHypotheses(
                        project.assistantId,
                        project._id.toString(),
                        userId,
                        isFirstProject
                    );

                if (
                    responseProjectHypotheses.isError ||
                    !responseProjectHypotheses.hypotheses
                ) {
                    console.error(`[${timestamp}] [createProject] ERROR: Failed to create project hypotheses for projectId: ${project._id.toString()}`);
                    console.error(`[${timestamp}] [createProject] Error details:`, {
                        isError: responseProjectHypotheses.isError,
                        hasHypotheses: !!responseProjectHypotheses.hypotheses,
                        hypothesesCount: responseProjectHypotheses.hypotheses?.length || 0,
                        errorMessage: responseProjectHypotheses.errorMessage,
                    });
                    throw new Error(
                        responseProjectHypotheses.errorMessage || 'Failed to create project hypotheses'
                    );
                }

                console.log(`[${timestamp}] [createProject] Project hypotheses created successfully:`, {
                    hypothesesCount: responseProjectHypotheses.hypotheses.length,
                    hypothesisIds: responseProjectHypotheses.hypotheses.map(h => h._id.toString()),
                });

                // Create all hypotheses parts (core, market research, person profile, etc.)
                console.log(`[${timestamp}] [createProject] Creating hypotheses parts...`);
                const responseCreateHypothesesParts = await createHypothesesParts({
                    projectHypotheses: responseProjectHypotheses.hypotheses,
                    assistantId: project.assistantId,
                    userId: userId,
                });

                if (responseCreateHypothesesParts.isError) {
                    console.error(`[${timestamp}] [createProject] ERROR: Failed to create hypotheses parts`);
                    console.error(`[${timestamp}] [createProject] Error details:`, {
                        isError: responseCreateHypothesesParts.isError,
                        errorMessage: responseCreateHypothesesParts.errorMessage,
                    });
                    throw new Error(
                        responseCreateHypothesesParts.errorMessage || 'Failed to create hypotheses parts'
                    );
                }

                console.log(`[${timestamp}] [createProject] Hypotheses parts created successfully`);

                // Update project status to Generated
                console.log(`[${timestamp}] [createProject] Updating project status to Generated...`);
                project.generationStatus = ProjectGenerationStatus.Generated;
                await project.save();

                // Mark that project generation is complete
                console.log(`[${timestamp}] [createProject] Marking project generation as complete...`);
                await userService.changeUser(userId, {
                    isProjectGenerated: true,
                });

                console.log(`[${timestamp}] [createProject] SUCCESS: Project creation completed for userId: ${userId}, projectId: ${project._id.toString()}`);
                // IProject имеет _id, но Project требует id - преобразуем
                return project as unknown as Project;
            } catch (error) {
                const errorTimestamp = new Date().toISOString();
                console.error(`[${errorTimestamp}] [createProject] FATAL ERROR: Project creation failed for userId: ${userId}`);
                console.error(`[${errorTimestamp}] [createProject] Error:`, error);
                console.error(`[${errorTimestamp}] [createProject] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
                throw elevateError(error);
            }
        },
    },
};

export default projectsMutationResolver;
