import { elevateError } from '../../errors/elevateError';
import { ChangeProjectHypothesisInput, CreateProjectHypothesisInput } from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import projectHypothesesService from '../../services/ProjectHypothesesService';

const projectHypothesesMutationResolvers = {
    Mutation: {
        async createProjectHypothesis(
            _: unknown,
            { input }: { input: CreateProjectHypothesisInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                return await projectHypothesesService.createProjectHypothesisBasedOnTitleAndDescription(
                    {
                        projectId: input.projectId,
                        title: input.title,
                        description: input.description,
                    },
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async changeProjectHypothesis(
            _: unknown,
            { input }: { input: ChangeProjectHypothesisInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                return await projectHypothesesService.changeProjectHypothesis(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async deleteProjectHypothesis(
            _: unknown,
            { id }: { id: string },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                await projectHypothesesService.deleteProjectHypothesis(
                    id,
                    context.userId
                );
                return true;
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default projectHypothesesMutationResolvers;
