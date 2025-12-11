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
                return await hypothesesPersonProfileService.getAllHypothesesPersonProfiles(
                    projectHypothesisId,
                    context.userId
                );
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default hypothesesPersonProfileQueryResolver;
