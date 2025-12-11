import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesCoreService from '../../services/HypothesesCoreService';

const hypothesesCoreQueryResolver = {
    Query: {
        async getHypothesesCore(
            _: never,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                return await hypothesesCoreService.getHypothesesCore(
                    projectHypothesisId,
                    context.userId
                );
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default hypothesesCoreQueryResolver;
