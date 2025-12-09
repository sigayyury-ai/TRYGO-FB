import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import assistantMessagesService from '../../services/AssistantMessagesService';
import { RequestedFeature } from '../../generated/graphql';
import requestFeatureService from '../../services/RequestFeatureService';

const requestFeatureMutationResolver = {
    Mutation: {
        async createRequestFeature(
            _: never,
            { requestedFeature }: { requestedFeature: RequestedFeature },
            context: IContext
        ) {
            try {
                await requestFeatureService.createRequestFeature(
                    context.userId,
                    requestedFeature
                );

                return 'Request feature created successfully';
            } catch (error) {
                throw elevateError(error);
            }
        },
    },
};

export default requestFeatureMutationResolver;
