import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/IUser';
import {
    ProjectGenerationStatus,
    ProjectStartType,
    UserRole,
} from '../generated/graphql';
import { IProject } from '../types/IProject';
import { IProjectHypothesis } from '../types/IProjectHypothesis';

const projectHypothesisSchema: Schema = new Schema<IProjectHypothesis>(
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
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'projectHypotheses',
    }
);

const ProjectHypothesisModel = mongoose.model<
    IProjectHypothesis,
    mongoose.Model<IProjectHypothesis>
>('ProjectHypothesis', projectHypothesisSchema);
export default ProjectHypothesisModel;
