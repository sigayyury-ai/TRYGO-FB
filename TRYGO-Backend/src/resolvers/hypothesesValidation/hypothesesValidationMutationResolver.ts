import { elevateError } from '../../errors/elevateError';
import { 
    ChangeHypothesesValidationInput, 
    UploadHypothesesValidationCustomerInterviewInput, 
    ProjectHypothesisIdPromptPartInput
} from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import hypothesesValidationService from '../../services/HypothesesValidationService';
import { createValidationPart } from '../../utils/hypothesis/createValidationPart';

const hypothesesValidationMutationResolver = {
    Mutation: {
        async changeHypothesesValidation(
            _: unknown,
            { input }: { input: ChangeHypothesesValidationInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                return await hypothesesValidationService.changeHypothesesValidation(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
        async createHypothesesValidation(
            _: unknown,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                // First check if it already exists
                const existing = await hypothesesValidationService.getHypothesesValidation(
                    projectHypothesisId,
                    context.userId
                );
                
                if (existing) {
                    return existing;
                }

                // If not exists, create new
                return await hypothesesValidationService.createHypothesesValidation(
                    projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                // If error is "already exists", try to return existing data
                if (error instanceof Error && error.message.includes('already exists')) {
                    try {
                        const existing = await hypothesesValidationService.getHypothesesValidation(
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

        async uploadHypothesesValidationCustomerInterview(
            _: unknown,
            { input }: { input: UploadHypothesesValidationCustomerInterviewInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                return await hypothesesValidationService.uploadHypothesesValidationCustomerInterview(input, context.userId);
            } catch (error) {
                throw elevateError(error);
            }
        },



        async regenerateHypothesesValidation(
            _: unknown,
            { input }: { input: ProjectHypothesisIdPromptPartInput },
            context: IContext
        ) {
            try {
                if (!context.userId) {
                    throw new Error('User not authenticated');
                }

                await hypothesesValidationService.deleteHypothesesValidation(
                    input.projectHypothesisId,
                    context.userId
                );

                await createValidationPart({
                    projectHypothesisId: input.projectHypothesisId,
                    userId: context.userId,
                    promptPart: input.promptPart,
                });

                return await hypothesesValidationService.getHypothesesValidation(
                    input.projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default hypothesesValidationMutationResolver;
