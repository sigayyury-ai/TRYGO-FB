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
                console.log(`[getAllHypothesesPersonProfiles resolver] Request for projectHypothesisId: ${projectHypothesisId}, userId: ${context.userId}`);
                const profiles = await hypothesesPersonProfileService.getAllHypothesesPersonProfiles(
                    projectHypothesisId,
                    context.userId
                );
                console.log(`[getAllHypothesesPersonProfiles resolver] Returning ${profiles.length} profiles`);
                return profiles;
            } catch (err) {
                console.error(`[getAllHypothesesPersonProfiles resolver] Error:`, err);
                elevateError(err);
            }
        },
    },
};

export default hypothesesPersonProfileQueryResolver;
