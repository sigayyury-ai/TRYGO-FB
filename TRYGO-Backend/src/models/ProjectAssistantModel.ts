import mongoose, { Schema } from 'mongoose';
import { IProjectAssistant } from '../types/IProjectAssistant';

const projectAssistantSchema: Schema = new Schema<IProjectAssistant>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        systemInstruction: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'projectAssistants',
    }
);

const ProjectAssistantModel = mongoose.model<
    IProjectAssistant,
    mongoose.Model<IProjectAssistant>
>('ProjectAssistant', projectAssistantSchema);
export default ProjectAssistantModel;
