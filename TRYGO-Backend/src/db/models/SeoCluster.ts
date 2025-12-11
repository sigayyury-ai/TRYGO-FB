import mongoose, { Schema, Document, Model } from "mongoose";

export type SeoClusterIntent = "commercial" | "transactional" | "informational" | "navigational";

export interface SeoClusterDoc extends Document {
  projectId: string;
  hypothesisId: string;
  title: string;
  intent: SeoClusterIntent;
  keywords: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const seoClusterSchema = new Schema<SeoClusterDoc>(
  {
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    hypothesisId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    intent: {
      type: String,
      required: true,
      enum: ["commercial", "transactional", "informational", "navigational"],
      default: "informational",
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
    collection: "seoAgentClusters", // Use collection name from semantics-service to maintain compatibility
  }
);

// Compound index for efficient queries
seoClusterSchema.index({ projectId: 1, hypothesisId: 1 });

export const SeoCluster: Model<SeoClusterDoc> =
  mongoose.models.SeoCluster || mongoose.model<SeoClusterDoc>("SeoCluster", seoClusterSchema);
