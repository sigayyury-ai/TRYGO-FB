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
    try {
        await checkIfProjectGenerationAllowed(userId);
        await userService.changeUser(userId, {
            isProjectGenerationStarted: true,
        });
        console.log('generateProject', input);
        const isFirstProject = await projectService.checkIfFirstProject(userId);
        const response = await projectService.createProject(input, userId);
        if (response.isError || !response.project) {
            socket.emit(EVENT_NAMES.projectGenerationError, {
                errorMessage: response.errorMessage,
            } as ProjectGenerationError);
            return;
        }
        const project = response.project;

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
            socket.emit(EVENT_NAMES.projectGenerationError, {
                errorMessage: responseProjectHypotheses.errorMessage,
            } as ProjectGenerationError);
            return;
        }

        const responseCreateHypothesesParts = await createHypothesesParts({
            projectHypotheses: responseProjectHypotheses.hypotheses,
            assistantId: project.assistantId,
            userId,
        });

        if (responseCreateHypothesesParts.isError) {
            socket.emit(EVENT_NAMES.projectGenerationError, {
                errorMessage: responseCreateHypothesesParts.errorMessage,
            } as ProjectGenerationError);
            return;
        }

        project.generationStatus = ProjectGenerationStatus.Generated;
        await project.save();
        await userService.changeUser(userId, {
            isProjectGenerated: true,
        });
        socket.emit(EVENT_NAMES.projectGenerated, {
            projectId: project._id.toString(),
        } as ProjectGeneratedEvent);
    } catch (error) {
        console.error(error);
        socket.emit(EVENT_NAMES.projectGenerationError, {
            errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
        } as ProjectGenerationError);
        sendErrorToTg(error as Error);
    }
};
