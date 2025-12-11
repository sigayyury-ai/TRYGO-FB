import { Socket } from 'socket.io';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import { createHypothesesParts } from '../hypothesis/createHypothesesParts';
import projectService from '../../services/ProjectService';
import { EVENT_NAMES } from '../../constants/socketIO/eventNames';
import { checkIfHypothesisGenerationAllowed } from '../subscription/checkIfHypothesisGenerationAllowed';

export interface GenerateProjectHypothesisInput {
    title: string;
    description: string;
    projectId: string;
}

export interface ProjectHypothesisGeneratedEvent {
    projectHypothesisId: string;
}

export const generateProjectHypothesis = async ({
    socket,
    input,
    userId,
}: {
    socket: Socket;
    input: GenerateProjectHypothesisInput;
    userId: string;
}) => {
    try {
        await checkIfHypothesisGenerationAllowed(input.projectId, userId);
        const projectHypothesis =
            await projectHypothesesService.createProjectHypothesisBasedOnTitleAndDescription(
                input,
                userId
            );
        const project = await projectService.getProjectById(
            input.projectId,
            userId
        );

        await createHypothesesParts({
            projectHypotheses: [projectHypothesis],
            assistantId: project.assistantId,
            userId,
        });

        socket.emit(EVENT_NAMES.projectHypothesisGenerated, {
            projectHypothesisId: projectHypothesis._id.toString(),
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
};
