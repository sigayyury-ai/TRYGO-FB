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
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

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
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                // First check if it already exists
                const existing = await hypothesesMarketResearchService.getHypothesesMarketResearch(
                    projectHypothesisId,
                    context.userId
                );
                
                if (existing) {
                    return existing;
                }

                // If not exists, create new
                return await hypothesesMarketResearchService.createHypothesesMarketResearch(
                    projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                console.error('[createHypothesesMarketResearch] Error:', error);
                
                // If error is "already exists", try to return existing data
                if (error instanceof Error && error.message.includes('already exists')) {
                    try {
                        const existing = await hypothesesMarketResearchService.getHypothesesMarketResearch(
                            projectHypothesisId,
                            context.userId
                        );
                        if (existing) {
                            return existing;
                        }
                    } catch (fetchError) {
                        console.error('[createHypothesesMarketResearch] Error fetching existing data:', fetchError);
                    }
                }
                
                throw elevateError(error);
            }
        },

        async regenerateHypothesesMarketResearch(
            _: unknown,
            { input }: { input: ProjectHypothesisIdPromptPartInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

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
