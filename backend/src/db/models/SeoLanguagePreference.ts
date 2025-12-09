import mongoose, { Schema } from "mongoose";

export interface SeoLanguagePreferenceDocument extends mongoose.Document {
  projectId: string;
  hypothesisId: string;
  language: string;
  source: "manual";
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SeoLanguagePreferenceSchema = new Schema<SeoLanguagePreferenceDocument>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    source: {
      type: String,
      enum: ["manual"],
      default: "manual"
    },
    updatedBy: { type: String, default: null }
  },
  {
    timestamps: true
  }
);

SeoLanguagePreferenceSchema.index(
  { projectId: 1, hypothesisId: 1 },
  { unique: true }
);

export const SeoLanguagePreference =
  mongoose.models.SeoLanguagePreference ||
  mongoose.model<SeoLanguagePreferenceDocument>(
    "SeoLanguagePreference",
    SeoLanguagePreferenceSchema,
    "seoLanguagePreferences"
  );

