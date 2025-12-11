import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesValidationService from '../../services/HypothesesValidationService';
import { createValidationPart } from '../../utils/hypothesis/createValidationPart';

const hypothesesValidationQueryResolver = {
    Query: {
        async getHypothesesValidation(
            _: never,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                const hypothesesValidation =
                    await hypothesesValidationService.getHypothesesValidation(
                        projectHypothesisId,
                        context.userId
                    );
                if (
                    hypothesesValidation &&
                    !hypothesesValidation?.summaryInterview
                ) {
                    await hypothesesValidationService.deleteHypothesesValidation(
                        projectHypothesisId,
                        context.userId
                    );

                    await createValidationPart({
                        projectHypothesisId: projectHypothesisId,
                        userId: context.userId,
                    });

                    return await hypothesesValidationService.getHypothesesValidation(
                        projectHypothesisId,
                        context.userId
                    );
                }
                return hypothesesValidation;
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default hypothesesValidationQueryResolver;
