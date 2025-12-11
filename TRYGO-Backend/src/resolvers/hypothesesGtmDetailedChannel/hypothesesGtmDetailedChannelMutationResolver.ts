import { elevateError } from '../../errors/elevateError';
import {
    ChangeHypothesesGtmDetailedChannelInput,
    CreateHypothesesGtmDetailedChannelInput,
    RegenerateHypothesesGtmDetailedChannelInput,
    GenerateHypothesesGtmDetailedChannelContentIdeaInput,
} from '../../generated/graphql';
import { IContext } from '../../types/IContext';
import hypothesesGtmDetailedChannelService from '../../services/HypothesesGtmDetailedChannelService';
import { createGtmDetailedChannelPart } from '../../utils/hypothesis/createGtmDetailedChannelPart';
import { generateContentIdea } from '../../utils/hypothesis/generateContentIdea';
import mongoose from 'mongoose';

const hypothesesGtmDetailedChannelMutationResolver = {
    Mutation: {
        async changeHypothesesGtmDetailedChannel(
            _: unknown,
            { input }: { input: ChangeHypothesesGtmDetailedChannelInput },
            context: IContext
        ) {
            try {
                return await hypothesesGtmDetailedChannelService.changeHypothesesGtmDetailedChannel(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },
        async createHypothesesGtmDetailedChannel(
            _: unknown,
            { input }: { input: CreateHypothesesGtmDetailedChannelInput },
            context: IContext
        ) {
            try {
                return await hypothesesGtmDetailedChannelService.createHypothesesGtmDetailedChannel(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async regenerateHypothesesGtmDetailedChannel(
            _: unknown,
            { input }: { input: RegenerateHypothesesGtmDetailedChannelInput },
            context: IContext
        ) {
            try {
                await hypothesesGtmDetailedChannelService.deleteHypothesesGtmDetailedChannel(
                    input.customerSegmentId,
                    context.userId
                );

                await createGtmDetailedChannelPart({
                    projectHypothesisId: input.projectHypothesisId,
                    customerSegmentId: input.customerSegmentId,
                    hypothesesGtmChannelId: input.hypothesesGtmChannelId,
                    userId: context.userId,
                    promptPart: input.promptPart,
                });

                return await hypothesesGtmDetailedChannelService.getHypothesesGtmDetailedChannel(
                    input,
                    context.userId
                );
            } catch (error) {
                throw elevateError(error);
            }
        },

        async generateHypothesesGtmDetailedChannelContentIdea(
            _: unknown,
            {
                input,
            }: { input: GenerateHypothesesGtmDetailedChannelContentIdeaInput },
            context: IContext
        ) {
            try {
                const hypothesesGtmDetailedChannel =
                    await hypothesesGtmDetailedChannelService.getHypothesesGtmDetailedChannelWithCheck(
                        input,
                        context.userId
                    );

                const gptContentIdea = await generateContentIdea(
                    hypothesesGtmDetailedChannel
                );
                console.log('gptContentIdea', gptContentIdea);
                const newContentIdeaId = new mongoose.Types.ObjectId().toString();
                const newContentIdea = {
                    title: gptContentIdea.title,
                    text: gptContentIdea.text,
                    id: newContentIdeaId,
                };
                console.log('newContentIdea', newContentIdea);

                hypothesesGtmDetailedChannel?.contentIdeas?.push(
                    newContentIdea
                );
                await hypothesesGtmDetailedChannel.save();

                return {
                    id: newContentIdeaId,
                    title: newContentIdea.title,
                    text: newContentIdea.text,
                };
            } catch (error) {
                throw elevateError(error);
            }
        },
        //TODO: add generateHypothesesGtmDetailedChannelContentIdea
    },
};

export default hypothesesGtmDetailedChannelMutationResolver;
