import { Schema, model, type Document, type Model } from "mongoose";

export type SeoClusterIntent =
  | "commercial"
  | "transactional"
  | "informational"
  | "navigational";

export interface SeoClusterAttrs {
  projectId: string;
  hypothesisId: string;
  title: string;
  intent: SeoClusterIntent;
  keywords: string[];
  createdBy: string;
  updatedBy: string;
}

export interface SeoClusterDoc extends SeoClusterAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SeoClusterSchema = new Schema<SeoClusterDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    intent: {
      type: String,
      enum: ["commercial", "transactional", "informational", "navigational"],
      required: true
    },
    keywords: { type: [String], default: [] },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true }
  },
  { timestamps: true }
);

export const SeoCluster: Model<SeoClusterDoc> = model<SeoClusterDoc>(
  "SeoCluster",
  SeoClusterSchema
);

