import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/IUser';
import {
    ProjectGenerationStatus,
    ProjectStartType,
    UserRole,
} from '../generated/graphql';
import { IProject } from '../types/IProject';

const projectSchema: Schema = new Schema<IProject>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        generationStatus: {
            type: String,
            required: true,
            enum: Object.values(ProjectGenerationStatus),
            default: ProjectGenerationStatus.InProgress,
        },
        startType: {
            type: String,
            required: true,
            enum: Object.values(ProjectStartType),
        },
        info: {
            type: String,
            required: true,
        },
        url: {
            type: String,
        },
        assistantId: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'projects',
    }
);

const ProjectModel = mongoose.model<IProject, mongoose.Model<IProject>>(
    'Project',
    projectSchema
);
export default ProjectModel;
