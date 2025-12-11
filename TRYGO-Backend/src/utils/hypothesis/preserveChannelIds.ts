import mongoose from 'mongoose';
import { ChangeHypothesesGtmInput } from '../../generated/graphql';
import { IHypothesesGtm } from '../../types/IHypothesesGtm';

/**
 * Preserves existing channel _ids when updating hypotheses GTM
 * For channels with id - maps id to _id to preserve existing MongoDB ObjectId
 * For channels without id - generates new _id
 */
export function preserveChannelIds(
    input: ChangeHypothesesGtmInput,
    existingHypothesesGtm: IHypothesesGtm
): any {
    const dataForUpdate: any = { ...input };

    // Helper function to process channels in a stage
    const processStageChannels = (
        inputStage: any,
        existingStage: any
    ) => {
        if (!inputStage?.channels) return inputStage;

        const processedChannels = inputStage.channels.map((inputChannel: any) => {
            if (inputChannel.id) {
                // Find existing channel by id and preserve its _id
                const existingChannel = existingStage?.channels?.find(
                    (ch: any) => ch._id.toString() === inputChannel.id
                );
                
                if (existingChannel) {
                    // Use existing _id
                    const { id, ...channelWithoutId } = inputChannel;
                    return {
                        ...channelWithoutId,
                        _id: existingChannel._id
                    };
                } else {
                    // Channel not found, create new _id from provided id
                    const { id, ...channelWithoutId } = inputChannel;
                    return {
                        ...channelWithoutId,
                        _id: new mongoose.Types.ObjectId(inputChannel.id)
                    };
                }
            } else {
                // New channel without id, generate new _id
                return {
                    ...inputChannel,
                    _id: new mongoose.Types.ObjectId()
                };
            }
        });

        return {
            ...inputStage,
            channels: processedChannels
        };
    };

    // Process each stage
    if (dataForUpdate.stageValidate) {
        dataForUpdate.stageValidate = processStageChannels(
            dataForUpdate.stageValidate,
            existingHypothesesGtm.stageValidate
        );
    }

    if (dataForUpdate.stageBuildAudience) {
        dataForUpdate.stageBuildAudience = processStageChannels(
            dataForUpdate.stageBuildAudience,
            existingHypothesesGtm.stageBuildAudience
        );
    }

    if (dataForUpdate.stageScale) {
        dataForUpdate.stageScale = processStageChannels(
            dataForUpdate.stageScale,
            existingHypothesesGtm.stageScale
        );
    }

    return dataForUpdate;
}
