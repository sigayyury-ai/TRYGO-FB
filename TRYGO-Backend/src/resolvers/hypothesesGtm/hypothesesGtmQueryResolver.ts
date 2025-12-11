import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesGtmService from '../../services/HypothesesGtmService';

const hypothesesGtmQueryResolver = {
    Query: {
        async getHypothesesGtm(
            _: never,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                const hypothesesGtm = await hypothesesGtmService.getHypothesesGtm(
                    projectHypothesisId,
                    context.userId
                );
                console.log('hypothesesGtm', hypothesesGtm);
                return hypothesesGtm;
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default hypothesesGtmQueryResolver;
