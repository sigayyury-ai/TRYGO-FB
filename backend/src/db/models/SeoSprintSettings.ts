import mongoose, { Schema } from "mongoose";

export interface SeoSprintSettingsDocument extends mongoose.Document {
  projectId: string;
  hypothesisId: string;
  weeklyCadence: number;
  publishDays: number[];
  timezone?: string | null;
  language?: string | null;
  updatedBy?: string | null;
  // WordPress connection settings
  wordpressBaseUrl?: string | null;
  wordpressUsername?: string | null;
  wordpressAppPassword?: string | null; // Encrypted in production
  wordpressPostType?: string | null; // Post type (default: "post", can be "blog" or custom)
  wordpressDefaultCategoryId?: number | null;
  wordpressDefaultTagIds?: number[];
  createdAt: Date;
  updatedAt: Date;
}

const SeoSprintSettingsSchema = new Schema<SeoSprintSettingsDocument>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    weeklyCadence: { type: Number, default: 3, min: 1, max: 14 },
    publishDays: {
      type: [Number],
      default: [1, 3, 5],
      validate: {
        validator: (value: number[]) =>
          Array.isArray(value) && value.length > 0 && value.every((day) => day >= 0 && day <= 6),
        message: "publishDays must be an array of weekday numbers (0-6)"
      }
    },
    timezone: { type: String, default: "UTC" },
    language: { type: String, default: null },
    updatedBy: { type: String, default: null },
    // WordPress connection settings
    wordpressBaseUrl: { type: String, default: null },
    wordpressUsername: { type: String, default: null },
    wordpressAppPassword: { type: String, default: null },
    wordpressPostType: { type: String, default: null }, // Post type (default: "post", can be "blog" or custom)
    wordpressDefaultCategoryId: { type: Number, default: null },
    wordpressDefaultTagIds: { type: [Number], default: [] }
  },
  {
    timestamps: true
  }
);

SeoSprintSettingsSchema.index(
  { projectId: 1, hypothesisId: 1 },
  { unique: true }
);

export const SeoSprintSettings =
  mongoose.models.SeoSprintSettings ||
  mongoose.model<SeoSprintSettingsDocument>(
    "SeoSprintSettings",
    SeoSprintSettingsSchema,
    "seoSprintSettings"
  );

