import mongoose, { Schema } from 'mongoose';
import { IHypothesesValidation } from '../types/IHypothesesValidation';

const summaryInterviewSchema: Schema = new Schema(
    {
        goals: [
            {
                type: String,
                required: true,
            },
        ],
        pains: [
            {
                type: String,
                required: true,
            },
        ],
        hypotheses: [
            {
                type: String,
                required: true,
            },
        ],
        toneOfVoice: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const hypothesesValidationSchema: Schema = new Schema<IHypothesesValidation>(
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
        validationChannels: [
            {
                type: String,
                required: true,
            },
        ],
        customerInterviewQuestions: [
            {
                type: String,
                required: true,
            },
        ],
        uploadedCustomerInterviews: {
            type: String,
        },
        insightsCustomerInterviews: {
            type: String,
        },
        summaryInterview: {
            type: summaryInterviewSchema
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'hypothesesValidations',
    }
);

const HypothesesValidationModel = mongoose.model<
    IHypothesesValidation,
    mongoose.Model<IHypothesesValidation>
>('HypothesesValidation', hypothesesValidationSchema);
export default HypothesesValidationModel;
