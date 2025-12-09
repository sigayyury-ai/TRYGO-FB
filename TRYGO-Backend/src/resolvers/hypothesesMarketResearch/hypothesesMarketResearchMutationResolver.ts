import { elevateError } from '../../errors/elevateError';
import { 
    ChangeHypothesesMarketResearchInput,
    ProjectHypothesisIdPromptPartInput
} from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import hypothesesMarketResearchService from '../../services/HypothesesMarketResearchService';
import { createMarketResearchPart } from '../../utils/hypothesis/createMarketResearchPart';

const hypothesesMarketResearchMutationResolver = {
    Mutation: {
        async changeHypothesesMarketResearch(
            _: unknown,
            { input }: { input: ChangeHypothesesMarketResearchInput },
            context: IContext
        ) {
            try {
                return await hypothesesMarketResearchService.changeHypothesesMarketResearch(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
        async createHypothesesMarketResearch(
            _: unknown,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                
                return await hypothesesMarketResearchService.createHypothesesMarketResearch(
                    projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async regenerateHypothesesMarketResearch(
            _: unknown,
            { input }: { input: ProjectHypothesisIdPromptPartInput },
            context: IContext
        ) {
            try {
                await hypothesesMarketResearchService.deleteHypothesesMarketResearch(
                    input.projectHypothesisId,
                    context.userId
                );

                await createMarketResearchPart({
                    projectHypothesisId: input.projectHypothesisId,
                    userId: context.userId,
                    promptPart: input.promptPart,
                });

                return await hypothesesMarketResearchService.getHypothesesMarketResearch(
                    input.projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default hypothesesMarketResearchMutationResolver;
