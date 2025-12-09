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
                return await hypothesesValidationService.createHypothesesValidation(
                    projectHypothesisId,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async uploadHypothesesValidationCustomerInterview(
            _: unknown,
            { input }: { input: UploadHypothesesValidationCustomerInterviewInput },
            context: IContext
        ) {
            try {
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
