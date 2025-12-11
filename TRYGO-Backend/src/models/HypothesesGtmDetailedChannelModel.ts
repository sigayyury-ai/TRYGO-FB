import mongoose, { Schema } from 'mongoose';
import {
    IHypothesesGtmDetailedChannel,
    IHypothesesGtmDetailedChannelPreparationTask,
    IHypothesesGtmDetailedChannelContentIdea,
    IHypothesesGtmDetailedChannelActionPlan,
    IHypothesesGtmDetailedChannelMetricsAndKpis,
} from '../types/IHypothesesGtmDetailedChannel';

const hypothesesGtmDetailedChannelPreparationTaskSchema = new Schema<IHypothesesGtmDetailedChannelPreparationTask>({
    text: {
        type: String,
        required: true,
    },
    isCompleted: {
        type: Boolean,
        required: true,
        default: false,
    },
});

const hypothesesGtmDetailedChannelContentIdeaSchema = new Schema<IHypothesesGtmDetailedChannelContentIdea>({
    title: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
});

const hypothesesGtmDetailedChannelActionPlanSchema = new Schema<IHypothesesGtmDetailedChannelActionPlan>({
    stageTitle: {
        type: String,
        required: true,
    },
    tasks: [hypothesesGtmDetailedChannelPreparationTaskSchema],
    isCompleted: {
        type: Boolean,
        required: true,
        default: false,
    },
});

const hypothesesGtmDetailedChannelMetricsAndKpisSchema = new Schema<IHypothesesGtmDetailedChannelMetricsAndKpis>({
    key: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
});

const hypothesesGtmDetailedChannelSchema: Schema = new Schema<IHypothesesGtmDetailedChannel>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        hypothesesGtmChannelId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        customerSegmentId: {
            type: Schema.Types.ObjectId,
            required: true,
        },
        channelStrategy: {
            type: String,
            required: true,
        },
        channelPreparationTasks: [hypothesesGtmDetailedChannelPreparationTaskSchema],
        tools: {
            type: String,
            required: true,
        },
        resources: {
            type: String,
            required: true,
        },
        contentIdeas: [hypothesesGtmDetailedChannelContentIdeaSchema],
        actionPlan: [hypothesesGtmDetailedChannelActionPlanSchema],
        metricsAndKpis: [hypothesesGtmDetailedChannelMetricsAndKpisSchema],
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'hypothesesGtmDetailedChannels',
    }
);

const HypothesesGtmDetailedChannelModel = mongoose.model<
    IHypothesesGtmDetailedChannel,
    mongoose.Model<IHypothesesGtmDetailedChannel>
>('HypothesesGtmDetailedChannel', hypothesesGtmDetailedChannelSchema);

export default HypothesesGtmDetailedChannelModel;