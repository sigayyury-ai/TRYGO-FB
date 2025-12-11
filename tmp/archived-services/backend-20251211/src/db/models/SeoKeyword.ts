import { Schema, model, type Document, type Model, type Types } from "mongoose";

export type SeoKeywordIntent =
  | "commercial"
  | "transactional"
  | "informational"
  | "navigational";

export interface SeoKeywordAttrs {
  projectId: string;
  hypothesisId: string;
  jobId: Types.ObjectId;
  keyword: string;
  searchVolume?: number | null;
  difficulty?: number | null;
  intent: SeoKeywordIntent;
  source?: string | null;
  opportunityScore?: number | null;
  createdBy: string;
  updatedBy: string;
}

export interface SeoKeywordDoc extends SeoKeywordAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SeoKeywordSchema = new Schema<SeoKeywordDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    jobId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "SeoKeywordDiscoveryJob" },
    keyword: { type: String, required: true },
    searchVolume: { type: Number, default: null },
    difficulty: { type: Number, default: null },
    intent: {
      type: String,
      enum: ["commercial", "transactional", "informational", "navigational"],
      required: true
    },
    source: { type: String, default: null },
    opportunityScore: { type: Number, default: null },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true }
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

SeoKeywordSchema.index(
  { projectId: 1, hypothesisId: 1, keyword: 1 },
  { unique: true }
);

export const SeoKeyword: Model<SeoKeywordDoc> = model<SeoKeywordDoc>(
  "SeoKeyword",
  SeoKeywordSchema
);
