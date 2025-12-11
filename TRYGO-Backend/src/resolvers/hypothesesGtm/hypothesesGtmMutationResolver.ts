import { elevateError } from '../../errors/elevateError';
import { 
    ChangeHypothesesGtmInput,
    ProjectHypothesisIdPromptPartInput
} from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import hypothesesGtmService from '../../services/HypothesesGtmService';
import { createGtmPart } from '../../utils/hypothesis/createGtmPart';
import projectHypothesesService from '../../services/ProjectHypothesesService';
import projectService from '../../services/ProjectService';

const hypothesesGtmMutationResolver = {
    Mutation: {
        async changeHypothesesGtm(
            _: unknown,
            { input }: { input: ChangeHypothesesGtmInput },
            context: IContext
        ) {
            try {
                return await hypothesesGtmService.changeHypothesesGtm(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
        async createHypothesesGtm(
            _: unknown,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                return await hypothesesGtmService.createHypothesesGtm(
                    projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async regenerateHypothesesGtm(
            _: unknown,
            { input }: { input: ProjectHypothesisIdPromptPartInput },
            context: IContext
        ) {
            try {
                await hypothesesGtmService.deleteHypothesesGtm(
                    input.projectHypothesisId,
                    context.userId
                );

                await createGtmPart({
                    projectHypothesisId: input.projectHypothesisId,
                    userId: context.userId,
                    promptPart: input.promptPart,
                });

                return await hypothesesGtmService.getHypothesesGtm(
                    input.projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default hypothesesGtmMutationResolver;
