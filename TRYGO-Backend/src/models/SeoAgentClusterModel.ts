import mongoose, { Schema } from 'mongoose';

export enum SeoAgentClusterIntent {
    INFORMATIONAL = 'INFORMATIONAL',
    NAVIGATIONAL = 'NAVIGATIONAL',
    TRANSACTIONAL = 'TRANSACTIONAL',
    COMMERCIAL = 'COMMERCIAL',
}

export interface ISeoAgentCluster {
    projectId: string;
    hypothesisId?: string;
    title: string;
    intent: SeoAgentClusterIntent;
    keywords: string[];
    createdBy?: string;
    updatedBy?: string;
}

const seoAgentClusterSchema = new Schema(
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
        intent: {
            type: String,
            required: true,
            enum: Object.values(SeoAgentClusterIntent),
        },
        keywords: {
            type: [String],
            default: [],
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
        collection: 'seoAgentClusters',
    }
);

// Indexes for efficient queries
// Compound index can be used for queries on projectId alone (MongoDB uses prefix of compound index)
seoAgentClusterSchema.index({ projectId: 1, hypothesisId: 1 });

export const SeoAgentClusterModel = mongoose.model<ISeoAgentCluster>(
    'SeoAgentCluster',
    seoAgentClusterSchema
);

