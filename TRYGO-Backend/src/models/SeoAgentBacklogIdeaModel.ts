import mongoose, { Schema } from 'mongoose';

export enum SeoAgentBacklogContentType {
    ARTICLE = 'ARTICLE',
    COMMERCIAL_PAGE = 'COMMERCIAL_PAGE',
    LANDING_PAGE = 'LANDING_PAGE',
}

export enum SeoAgentBacklogStatus {
    PENDING = 'PENDING',
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    ARCHIVED = 'ARCHIVED',
}

export interface ISeoAgentBacklogIdea {
    projectId: string;
    hypothesisId?: string;
    title: string;
    description?: string;
    contentType: SeoAgentBacklogContentType;
    clusterId?: string;
    status: SeoAgentBacklogStatus;
    createdBy?: string;
    updatedBy?: string;
}

const seoAgentBacklogIdeaSchema = new Schema(
    {
        projectId: {
            type: String,
            required: true,
        },
        hypothesisId: {
            type: String,
            index: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        contentType: {
            type: String,
            required: true,
            enum: Object.values(SeoAgentBacklogContentType),
        },
        clusterId: {
            type: String,
        },
        status: {
            type: String,
            required: true,
            enum: Object.values(SeoAgentBacklogStatus),
            default: SeoAgentBacklogStatus.PENDING,
            index: true,
        },
        createdBy: {
            type: String,
        },
        updatedBy: {
            type: String,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'seoAgentBacklogIdeas',
    }
);

// Indexes for efficient queries
seoAgentBacklogIdeaSchema.index({ projectId: 1, hypothesisId: 1 });
seoAgentBacklogIdeaSchema.index({ projectId: 1, status: 1 });
seoAgentBacklogIdeaSchema.index({ clusterId: 1 });

export const SeoAgentBacklogIdeaModel = mongoose.model<ISeoAgentBacklogIdea>(
    'SeoAgentBacklogIdea',
    seoAgentBacklogIdeaSchema
);

