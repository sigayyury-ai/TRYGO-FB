import mongoose, { Schema } from 'mongoose';

export interface ISeoAgentPostingSettings {
    projectId: string;
    hypothesisId?: string;
    weeklyPublishCount: number;
    preferredDays: string[];
    autoPublishEnabled: boolean;
    updatedBy?: string;
}

const seoAgentPostingSettingsSchema = new Schema(
    {
        projectId: {
            type: String,
            required: true,
            unique: true,
        },
        hypothesisId: {
            type: String,
            index: true,
        },
        weeklyPublishCount: {
            type: Number,
            required: true,
            default: 2,
            min: 1,
            max: 7,
        },
        preferredDays: {
            type: [String],
            default: ['Tuesday', 'Thursday'],
        },
        autoPublishEnabled: {
            type: Boolean,
            default: false,
        },
        updatedBy: {
            type: String,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: 'seoAgentPostingSettings',
    }
);

// Ensure unique projectId (one settings per project)
seoAgentPostingSettingsSchema.index({ projectId: 1 }, { unique: true });

export const SeoAgentPostingSettingsModel = mongoose.model<ISeoAgentPostingSettings>(
    'SeoAgentPostingSettings',
    seoAgentPostingSettingsSchema
);

