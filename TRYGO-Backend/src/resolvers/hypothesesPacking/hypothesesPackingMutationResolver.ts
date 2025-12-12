import { elevateError } from '../../errors/elevateError';
import { 
    ChangeHypothesesPackingInput,
    ProjectHypothesisIdPromptPartInput
} from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import hypothesesPackingService from '../../services/HypothesesPackingService';
import { createPackingPart } from '../../utils/hypothesis/createPackingPart';

const hypothesesPackingMutationResolver = {
    Mutation: {
        async changeHypothesesPacking(
            _: unknown,
            { input }: { input: ChangeHypothesesPackingInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                return await hypothesesPackingService.changeHypothesesPacking(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
        async createHypothesesPacking(
            _: unknown,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                // First check if it already exists
                const existing = await hypothesesPackingService.getHypothesesPacking(
                    projectHypothesisId,
                    context.userId
                );
                
                if (existing) {
                    return existing;
                }

                // If not exists, create new
                return await hypothesesPackingService.createHypothesesPacking(
                    projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                // If error is "already exists", try to return existing data
                if (error instanceof Error && error.message.includes('already exists')) {
                    try {
                        const existing = await hypothesesPackingService.getHypothesesPacking(
                            projectHypothesisId,
                            context.userId
                        );
                        if (existing) {
                            return existing;
                        }
                    } catch (fetchError) {
                        // Silent fail, throw original error
                    }
                }
                
                throw elevateError(error);
            }
        },

        async regenerateHypothesesPacking(
            _: unknown,
            { input }: { input: ProjectHypothesisIdPromptPartInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                await hypothesesPackingService.deleteHypothesesPacking(
                    input.projectHypothesisId,
                    context.userId
                );

                await createPackingPart({
                    projectHypothesisId: input.projectHypothesisId,
                    userId: context.userId,
                    promptPart: input.promptPart,
                });

                return await hypothesesPackingService.getHypothesesPacking(
                    input.projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default hypothesesPackingMutationResolver;
