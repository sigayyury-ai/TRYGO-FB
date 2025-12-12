import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';

const hypothesesPersonProfileQueryResolver = {
    Query: {
        async getAllHypothesesPersonProfiles(
            _: never,
            { projectHypothesisId }: { projectHypothesisId: string },
            context: IContext
        ) {
            try {
                // Removed verbose logging
                const profiles = await hypothesesPersonProfileService.getAllHypothesesPersonProfiles(
                    projectHypothesisId,
                    context.userId
                );
                // Removed verbose logging
                return profiles;
            } catch (err) {
                console.error(`[getAllHypothesesPersonProfiles resolver] Error:`, err);
                elevateError(err);
            }
        },
    },
};

export default hypothesesPersonProfileQueryResolver;
