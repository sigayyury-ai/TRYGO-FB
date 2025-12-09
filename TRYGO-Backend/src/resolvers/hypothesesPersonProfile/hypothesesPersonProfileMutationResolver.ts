import { elevateError } from '../../errors/elevateError';
import { 
    ChangeHypothesesPersonProfileInput,
} from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import hypothesesPersonProfileService from '../../services/HypothesesPersonProfileService';

const hypothesesPersonProfileMutationResolver = {
    Mutation: {
        async changeHypothesesPersonProfile(
            _: unknown,
            { input }: { input: ChangeHypothesesPersonProfileInput },
            context: IContext
        ) {
            try {
                return await hypothesesPersonProfileService.changeHypothesesPersonProfile(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default hypothesesPersonProfileMutationResolver;
