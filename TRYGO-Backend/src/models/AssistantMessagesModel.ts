import mongoose, { Schema } from 'mongoose';
import { IAssistantMessages } from '../types/IAssistantMessages';

const assistantMessagesSchema: Schema = new Schema<IAssistantMessages>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        generatedMessages: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'assistantMessages',
    }
);

const AssistantMessagesModel = mongoose.model<
    IAssistantMessages,
    mongoose.Model<IAssistantMessages>
>('AssistantMessages', assistantMessagesSchema);
export default AssistantMessagesModel;
