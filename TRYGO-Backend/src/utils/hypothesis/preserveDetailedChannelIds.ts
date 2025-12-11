import mongoose from 'mongoose';
import { ChangeHypothesesGtmDetailedChannelInput } from '../../generated/graphql';
import { IHypothesesGtmDetailedChannel } from '../../types/IHypothesesGtmDetailedChannel';

/**
 * Preserves existing _ids when updating hypotheses GTM detailed channel
 * For items with id - maps id to _id to preserve existing MongoDB ObjectId
 * For items without id - generates new _id
 */
export function preserveDetailedChannelIds(
    input: ChangeHypothesesGtmDetailedChannelInput,
    existingHypothesesGtmDetailedChannel: IHypothesesGtmDetailedChannel
): any {
    const dataForUpdate: any = { ...input };

    // Helper function to process array items with id field
    const processArrayItems = (
        inputArray: any[],
        existingArray: any[]
    ) => {
        if (!inputArray) return inputArray;

        return inputArray.map((inputItem: any) => {
            if (inputItem.id) {
                // Find existing item by id and preserve its _id
                const existingItem = existingArray?.find(
                    (item: any) => item._id.toString() === inputItem.id
                );
                
                if (existingItem) {
                    // Use existing _id
                    const { id, ...itemWithoutId } = inputItem;
                    return {
                        ...itemWithoutId,
                        _id: existingItem._id
                    };
                } else {
                    // Item not found, create new _id from provided id
                    const { id, ...itemWithoutId } = inputItem;
                    return {
                        ...itemWithoutId,
                        _id: new mongoose.Types.ObjectId(inputItem.id)
                    };
                }
            } else {
                // New item without id, generate new _id
                return {
                    ...inputItem,
                    _id: new mongoose.Types.ObjectId()
                };
            }
        });
    };

    // Process channelPreparationTasks
    if (dataForUpdate.channelPreparationTasks) {
        dataForUpdate.channelPreparationTasks = processArrayItems(
            dataForUpdate.channelPreparationTasks,
            existingHypothesesGtmDetailedChannel.channelPreparationTasks || []
        );
    }

    // Process contentIdeas
    if (dataForUpdate.contentIdeas) {
        dataForUpdate.contentIdeas = processArrayItems(
            dataForUpdate.contentIdeas,
            existingHypothesesGtmDetailedChannel.contentIdeas || []
        );
    }

    // Process actionPlan (with nested tasks)
    if (dataForUpdate.actionPlan) {
        dataForUpdate.actionPlan = dataForUpdate.actionPlan.map((inputActionPlan: any) => {
            let processedActionPlan: any;

            if (inputActionPlan.id) {
                // Find existing action plan by id
                const existingActionPlan = existingHypothesesGtmDetailedChannel.actionPlan?.find(
                    (ap: any) => ap._id.toString() === inputActionPlan.id
                );
                
                if (existingActionPlan) {
                    // Use existing _id
                    const { id, ...actionPlanWithoutId } = inputActionPlan;
                    processedActionPlan = {
                        ...actionPlanWithoutId,
                        _id: new mongoose.Types.ObjectId(existingActionPlan.id)
                    };
                } else {
                    // Action plan not found, create new _id from provided id
                    const { id, ...actionPlanWithoutId } = inputActionPlan;
                    processedActionPlan = {
                        ...actionPlanWithoutId,
                        _id: new mongoose.Types.ObjectId(inputActionPlan.id)
                    };
                }
            } else {
                // New action plan without id, generate new _id
                processedActionPlan = {
                    ...inputActionPlan,
                    _id: new mongoose.Types.ObjectId()
                };
            }

            // Process nested tasks within action plan
            if (processedActionPlan.tasks) {
                const existingActionPlan = existingHypothesesGtmDetailedChannel.actionPlan?.find(
                    (ap: any) => ap._id.toString() === processedActionPlan._id.toString()
                );
                
                processedActionPlan.tasks = processArrayItems(
                    processedActionPlan.tasks,
                    existingActionPlan?.tasks || []
                );
            }

            return processedActionPlan;
        });
    }

    // Process metricsAndKpis
    if (dataForUpdate.metricsAndKpis) {
        dataForUpdate.metricsAndKpis = processArrayItems(
            dataForUpdate.metricsAndKpis,
            existingHypothesesGtmDetailedChannel.metricsAndKpis || []
        );
    }

    return dataForUpdate;
}
