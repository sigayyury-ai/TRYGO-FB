import mongoose, { Schema } from 'mongoose';
import { IRequestFeature } from '../types';
import { RequestedFeature } from '../generated/graphql';

const requestFeatureSchema: Schema = new Schema<IRequestFeature>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        requestedFeature: {
            type: String,
            required: true,
            enum: Object.values(RequestedFeature),
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'requestFeatures',
    }
);

const RequestFeatureModel = mongoose.model<
    IRequestFeature,
    mongoose.Model<IRequestFeature>
>('RequestFeature', requestFeatureSchema);
export default RequestFeatureModel;
