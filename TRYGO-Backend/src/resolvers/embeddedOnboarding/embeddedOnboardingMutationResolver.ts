import embeddedOnboardingService from '../../services/EmbeddedOnboardingService';
import { elevateError } from '../../errors/elevateError';
import { EmbeddedOnboardingInput } from '../../generated/graphql';
import { IContext } from '../../types/IContext';

const embeddedOnboardingMutationResolver = {
    Mutation: {
        async submitEmbeddedOnboarding(
            _: unknown,
            { input }: { input: EmbeddedOnboardingInput },
            context: IContext
        ) {
            try {
                const response = await embeddedOnboardingService.submitOnboarding({
                    email: input.email,
                    startType: input.startType,
                    info: input.info,
                    url: input.url || undefined,
                    embedSource: input.embedSource || undefined,
                });

                return response;
            } catch (err) {
                console.error('[EmbeddedOnboardingResolver] Error:', err);
                elevateError(err);
            }
        },
    },
};

export default embeddedOnboardingMutationResolver;
