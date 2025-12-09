import mongoose, { Schema } from 'mongoose';
import {
    IHypothesesGtm,
    IHypothesesGtmChannel,
    IHypothesesGtmStage,
} from '../types/IHypothesesGtm';
import {
    HypothesesGtmChannelStatus,
    HypothesesGtmChannelType,
} from '../generated/graphql';

const hypothesesGtmChannelSchema = new Schema<IHypothesesGtmChannel>({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: Object.values(HypothesesGtmChannelType),
        required: true,
    },

    description: {
        type: String,
        required: true,
    },
    kpis: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(HypothesesGtmChannelStatus),
        required: true,
        default: HypothesesGtmChannelStatus.Planned,
    },
    strategy: {
        type: String,
    },
});

const hypothesesGtmStageSchema = new Schema<IHypothesesGtmStage>(
    {
        name: {
            type: String,
            required: true,
        },
        channels: [hypothesesGtmChannelSchema],
    },
    {
        _id: false,
    }
);

const hypothesesGtmSchema: Schema = new Schema<IHypothesesGtm>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        threadId: {
            type: String,
            required: true,
        },
        projectHypothesisId: {
            type: Schema.Types.ObjectId,
            ref: 'ProjectHypothesis',
            required: true,
        },
        stageValidate: hypothesesGtmStageSchema,
        stageBuildAudience: hypothesesGtmStageSchema,
        stageScale: hypothesesGtmStageSchema,
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'hypothesesGtms',
    }
);

const HypothesesGtmModel = mongoose.model<
    IHypothesesGtm,
    mongoose.Model<IHypothesesGtm>
>('HypothesesGtm', hypothesesGtmSchema);
export default HypothesesGtmModel;
