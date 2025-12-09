import mongoose, { Schema } from "mongoose";

export interface SeoSprintSettingsDocument extends mongoose.Document {
  projectId: string;
  hypothesisId: string;
  weeklyCadence: number;
  publishDays: number[];
  timezone?: string | null;
  language?: string | null;
  updatedBy?: string | null;
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
    updatedBy: { type: String, default: null }
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

