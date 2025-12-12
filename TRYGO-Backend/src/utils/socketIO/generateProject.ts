import { Socket } from 'socket.io';
import {
    ProjectGenerationStatus,
    ProjectStartType,
} from '../../generated/graphql';
import projectService from '../../services/ProjectService';
import { EVENT_NAMES } from '../../constants/socketIO/eventNames';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import hypothesesCoreService from '../../services/HypothesesCoreService';
import { Types } from 'mongoose';
import hypothesesMarketResearchService from '../../services/HypothesesMarketResearchService';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';
import { createHypothesesParts } from '../hypothesis/createHypothesesParts';
import { sendErrorToTg } from '../sendErrorToTg';
import userService from '../../services/UserService';
import { checkIfProjectGenerationAllowed } from '../subscription/checkIfProjectGenerationAllowed';
import { safeEmit } from './safeEmit';

export interface GenerateProjectInput {
    startType: ProjectStartType;
    info: string;
    url?: string;
}

export interface ProjectGeneratedEvent {
    projectId: string;
}

export interface ProjectGenerationError {
    errorMessage: string;
}

export const generateProject = async ({
    socket,
    input,
    userId,
}: {
    socket: Socket;
    input: GenerateProjectInput;
    userId: string;
}) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [generateProject-SocketIO] Starting project creation for userId: ${userId}`);
    console.log(`[${timestamp}] [generateProject-SocketIO] Input:`, {
        startType: input.startType,
        infoLength: input.info?.length || 0,
        hasUrl: !!input.url,
    });

    try {
        console.log(`[${timestamp}] [generateProject-SocketIO] Checking if project generation is allowed...`);
        await checkIfProjectGenerationAllowed(userId);
        
        console.log(`[${timestamp}] [generateProject-SocketIO] Marking project generation as started...`);
        await userService.changeUser(userId, {
            isProjectGenerationStarted: true,
        });
        
        const isFirstProject = await projectService.checkIfFirstProject(userId);
        console.log(`[${timestamp}] [generateProject-SocketIO] Is first project: ${isFirstProject}`);
        
        console.log(`[${timestamp}] [generateProject-SocketIO] Creating project...`);
        const response = await projectService.createProject(input, userId);
        if (response.isError || !response.project) {
            console.error(`[${timestamp}] [generateProject-SocketIO] ERROR: Failed to create project`);
            console.error(`[${timestamp}] [generateProject-SocketIO] Error details:`, {
                isError: response.isError,
                hasProject: !!response.project,
                errorMessage: response.errorMessage,
            });
            safeEmit(socket, EVENT_NAMES.projectGenerationError, {
                errorMessage: response.errorMessage,
            } as ProjectGenerationError);
            return;
        }
        const project = response.project;
        console.log(`[${timestamp}] [generateProject-SocketIO] Project created: ${project._id.toString()}`);

        console.log(`[${timestamp}] [generateProject-SocketIO] Generating project hypotheses...`);
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
            console.error(`[${timestamp}] [generateProject-SocketIO] ERROR: Failed to create project hypotheses`);
            console.error(`[${timestamp}] [generateProject-SocketIO] Error details:`, {
                isError: responseProjectHypotheses.isError,
                hasHypotheses: !!responseProjectHypotheses.hypotheses,
                hypothesesCount: responseProjectHypotheses.hypotheses?.length || 0,
                errorMessage: responseProjectHypotheses.errorMessage,
            });
            socket.emit(EVENT_NAMES.projectGenerationError, {
                errorMessage: responseProjectHypotheses.errorMessage,
            } as ProjectGenerationError);
            return;
        }
        console.log(`[${timestamp}] [generateProject-SocketIO] Hypotheses created: ${responseProjectHypotheses.hypotheses.length}`);

        console.log(`[${timestamp}] [generateProject-SocketIO] Creating hypotheses parts...`);
        const responseCreateHypothesesParts = await createHypothesesParts({
            projectHypotheses: responseProjectHypotheses.hypotheses,
            assistantId: project.assistantId,
            userId,
        });

        if (responseCreateHypothesesParts.isError) {
            console.error(`[${timestamp}] [generateProject-SocketIO] ERROR: Failed to create hypotheses parts`);
            console.error(`[${timestamp}] [generateProject-SocketIO] Error details:`, {
                isError: responseCreateHypothesesParts.isError,
                errorMessage: responseCreateHypothesesParts.errorMessage,
            });
            socket.emit(EVENT_NAMES.projectGenerationError, {
                errorMessage: responseCreateHypothesesParts.errorMessage,
            } as ProjectGenerationError);
            return;
        }
        console.log(`[${timestamp}] [generateProject-SocketIO] Hypotheses parts created successfully`);

        console.log(`[${timestamp}] [generateProject-SocketIO] Updating project status...`);
        project.generationStatus = ProjectGenerationStatus.Generated;
        await project.save();
        await userService.changeUser(userId, {
            isProjectGenerated: true,
        });
        
        console.log(`[${timestamp}] [generateProject-SocketIO] SUCCESS: Project creation completed, emitting event`);
        safeEmit(socket, EVENT_NAMES.projectGenerated, {
            projectId: project._id.toString(),
        } as ProjectGeneratedEvent);
    } catch (error) {
        const errorTimestamp = new Date().toISOString();
        console.error(`[${errorTimestamp}] [generateProject-SocketIO] FATAL ERROR: Project creation failed`);
        console.error(`[${errorTimestamp}] [generateProject-SocketIO] Error:`, error);
        console.error(`[${errorTimestamp}] [generateProject-SocketIO] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
        socket.emit(EVENT_NAMES.projectGenerationError, {
            errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
        } as ProjectGenerationError);
        sendErrorToTg(error as Error);
    }
};
