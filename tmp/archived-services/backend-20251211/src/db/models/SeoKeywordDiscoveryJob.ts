import { Schema, model, type Document, type Model } from "mongoose";

export type DiscoveryJobStatus = "pending" | "running" | "completed" | "failed";

export interface SeoKeywordDiscoveryJobAttrs {
  projectId: string;
  hypothesisId: string;
  userId: string;
  status: DiscoveryJobStatus;
  seedKeywords: string[];
  language: string;
  totalKeywords?: number;
  errorMessage?: string | null;
}

export interface SeoKeywordDiscoveryJobDoc
  extends SeoKeywordDiscoveryJobAttrs,
    Document {
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
}

const SeoKeywordDiscoveryJobSchema = new Schema<SeoKeywordDiscoveryJobDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
      index: true
    },
    seedKeywords: { type: [String], default: [] },
    language: { type: String, default: "English" },
    totalKeywords: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    completedAt: { type: Date, default: null }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const SeoKeywordDiscoveryJob: Model<SeoKeywordDiscoveryJobDoc> =
  model<SeoKeywordDiscoveryJobDoc>(
    "SeoKeywordDiscoveryJob",
    SeoKeywordDiscoveryJobSchema
  );
