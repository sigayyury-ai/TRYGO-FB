import { elevateError } from '../../errors/elevateError';
import { ChangeProjectHypothesisInput } from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import projectHypothesesService from '../../services/ProjectHypothesesService';

const projectHypothesesMutationResolvers = {
    Mutation: {
        async changeProjectHypothesis(
            _: unknown,
            { input }: { input: ChangeProjectHypothesisInput },
            context: IContext
        ) {
            try {
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
