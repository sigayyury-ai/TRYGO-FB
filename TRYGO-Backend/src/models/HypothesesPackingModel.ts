import mongoose, { Schema } from 'mongoose';
import { IHypothesesPacking } from '../types/IHypothesesPacking';

const hypothesesPackingSchema: Schema =
    new Schema<IHypothesesPacking>(
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
            summary: {
                type: String,
                required: true,
            },
        },
        {
            timestamps: true,
            versionKey: false,
            collection: 'hypothesesPackings',
        }
    );

const HypothesesPackingModel = mongoose.model<
    IHypothesesPacking,
    mongoose.Model<IHypothesesPacking>
>('HypothesesPacking', hypothesesPackingSchema);
export default HypothesesPackingModel;
