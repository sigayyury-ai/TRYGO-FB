import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import hypothesesGtmDetailedChannelService from '../../services/HypothesesGtmDetailedChannelService';
import { GetHypothesesGtmDetailedChannelInput } from '../../generated/graphql';

const hypothesesGtmDetailedChannelQueryResolver = {
    Query: {
        async getHypothesesGtmDetailedChannel(
            _: never,
            { input }: { input: GetHypothesesGtmDetailedChannelInput },
            context: IContext
        ) {
            try {
                const hypothesesGtmDetailedChannel =
                    await hypothesesGtmDetailedChannelService.getHypothesesGtmDetailedChannel(
                        input,
                        context.userId
                    );
                console.log(
                    'hypothesesGtmDetailedChannel',
                    hypothesesGtmDetailedChannel
                );
                return hypothesesGtmDetailedChannel;
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default hypothesesGtmDetailedChannelQueryResolver;
