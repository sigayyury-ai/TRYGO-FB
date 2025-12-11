import mongoose, { Schema } from 'mongoose';
import {
    ICjmPart,
    IHypothesesPersonProfile,
} from '../types/IHypothesesPersonProfile';

const cjmPartSchema = new Schema<ICjmPart>(
    {
        opportunities: String,
        barriers: String,
    },
    {
        _id: false,
    }
);

const hypothesesPersonProfileSchema: Schema =
    new Schema<IHypothesesPersonProfile>(
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
            customerSegmentId: {
                type: Schema.Types.ObjectId,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            avatarUrl: {
                type: String,
                required: false,
            },
            description: {
                type: String,
                required: true,
            },
            platforms: {
                type: [String],
                required: true,
            },
            age: {
                type: Number,
                required: true,
            },
            location: {
                type: String,
                required: true,
            },
            education: {
                type: String,
                required: true,
            },
            userGoals: [
                {
                    type: String,
                    required: true,
                },
            ],
            userPains: [
                {
                    type: String,
                    required: true,
                },
            ],
            userGains: [
                {
                    type: String,
                    required: true,
                },
            ],
            userTriggers: [
                {
                    type: String,
                    required: true,
                },
            ],
            jbtd: {
                functionalAspects: String,
                personalDimension: String,
                socialDimension: String,
            },
            cjm: {
                awareness: cjmPartSchema,
                consideration: cjmPartSchema,
                acquisition: cjmPartSchema,
                service: cjmPartSchema,
                loyalty: cjmPartSchema,
            },
        },
        {
            timestamps: true,
            versionKey: false,
            collection: 'hypothesesPersonProfiles',
        }
    );

const HypothesesPersonProfileModel = mongoose.model<
    IHypothesesPersonProfile,
    mongoose.Model<IHypothesesPersonProfile>
>('HypothesesPersonProfile', hypothesesPersonProfileSchema);
export default HypothesesPersonProfileModel;
