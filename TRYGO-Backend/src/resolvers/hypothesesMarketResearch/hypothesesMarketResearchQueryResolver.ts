import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesMarketResearchService from '../../services/HypothesesMarketResearchService';

const hypothesesMarketResearchQueryResolver = {
    Query: {
        async getHypothesesMarketResearch(
            _: never,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                return await hypothesesMarketResearchService.getHypothesesMarketResearch(
                    projectHypothesisId,
                    context.userId
                );
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default hypothesesMarketResearchQueryResolver;
