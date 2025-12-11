import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesPackingService from '../../services/HypothesesPackingService';

const hypothesesPackingQueryResolver = {
    Query: {
        async getHypothesesPacking(
            _: never,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                return await hypothesesPackingService.getHypothesesPacking(
                    projectHypothesisId,
                    context.userId
                );
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default hypothesesPackingQueryResolver;
