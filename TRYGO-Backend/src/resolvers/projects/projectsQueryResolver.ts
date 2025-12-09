import authService from '../../services/AuthService';
import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import projectService from '../../services/ProjectService';

const projectsQueryResolver = {
    Query: {
        async getProjects(_: never, __: unknown, context: IContext) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                return await projectService.getProjects(userId);
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default projectsQueryResolver;
