import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import projectHypothesesService from '../../services/ProjectHypothesesService';

const projectHypothesesQueryResolver = {
    Query: {
        async getProjectHypotheses(
            _: never,
            { projectId }: { projectId: string },
            context: IContext
        ) {
            try {
                return await projectHypothesesService.getProjectHypotheses(
                    projectId,
                    context.userId
                );
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default projectHypothesesQueryResolver;
