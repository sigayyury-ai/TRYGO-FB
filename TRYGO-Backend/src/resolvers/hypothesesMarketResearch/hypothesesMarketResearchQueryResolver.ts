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
                const result = await hypothesesMarketResearchService.getHypothesesMarketResearch(
                    projectHypothesisId,
                    context.userId
                );
                // Если данных нет, возвращаем null (схема позволяет null)
                return result || null;
            } catch (err) {
                console.error('[HypothesesMarketResearchResolver] Error:', err);
                elevateError(err);
            }
        },
    },
};

export default hypothesesMarketResearchQueryResolver;
