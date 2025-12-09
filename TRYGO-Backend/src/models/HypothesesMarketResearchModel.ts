import mongoose, { Schema } from 'mongoose';
import { IHypothesesMarketResearch } from '../types/IHypothesesMarketResearch';

const hypothesesMarketResearchSchema: Schema =
    new Schema<IHypothesesMarketResearch>(
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
            collection: 'hypothesesMarketResearches',
        }
    );

const HypothesesMarketResearchModel = mongoose.model<
    IHypothesesMarketResearch,
    mongoose.Model<IHypothesesMarketResearch>
>('HypothesesMarketResearch', hypothesesMarketResearchSchema);
export default HypothesesMarketResearchModel;
