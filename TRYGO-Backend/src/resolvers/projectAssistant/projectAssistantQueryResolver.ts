import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import projectAssistantService from '../../services/ProjectAssistantService';

const projectAssistantQueryResolver = {
    Query: {
        async getProjectAssistant(
            _: never,
            { projectId }: { projectId: string },
            context: IContext
        ) {
            try {
                return await projectAssistantService.getProjectAssistant(
                    projectId,
                    context.userId
                );
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default projectAssistantQueryResolver;
