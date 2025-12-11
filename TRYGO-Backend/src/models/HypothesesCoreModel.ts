import mongoose, { Schema } from 'mongoose';
import { IHypothesesCore, ICustomerSegment } from '../types/IHypothesesCore';
import { ChannelType } from '../generated/graphql';

const customerSegmentSchema: Schema = new Schema<ICustomerSegment>({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
});

const hypothesesCoreSchema: Schema = new Schema<IHypothesesCore>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        projectHypothesisId: {
            type: Schema.Types.ObjectId,
            ref: 'ProjectHypothesis',
            required: true,
        },
        threadId: {
            type: String,
            required: true,
        },
        problems: [
            {
                type: String,
                required: true,
            },
        ],
        customerSegments: [customerSegmentSchema],
        uniqueProposition: {
            type: String,
            required: true,
        },
        solutions: [
            {
                type: String,
                required: true,
            },
        ],
        keyMetrics: [
            {
                type: String,
                required: true,
            },
        ],
        channels: [
            {
                channelType: {
                    type: String,
                    required: true,
                    enum: Object.values(ChannelType),
                },
                variants: [
                    {
                        name: {
                            type: String,
                            required: true,
                        },
                        url: {
                            type: String,
                        },
                    },
                ],
            },
        ],
        costStructure: {
            type: String,
            required: true,
        },
        revenueStream: {
            type: String,
            required: true,
        },
        unfairAdvantages: [
            {
                type: String,
                required: true,
            },
        ],

    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'hypothesesCores',
    }
);

const HypothesesCoreModel = mongoose.model<
    IHypothesesCore,
    mongoose.Model<IHypothesesCore>
>('HypothesesCore', hypothesesCoreSchema);
export default HypothesesCoreModel;
