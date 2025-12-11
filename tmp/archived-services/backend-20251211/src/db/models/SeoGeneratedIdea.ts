import { Schema, model, type Document, type Model } from "mongoose";

export interface SeoGeneratedIdeaAttrs {
  projectId: string;
  hypothesisId: string;
  userId: string;
  category: string;
  title: string;
  summary: string;
  clusterTitle?: string | null;
  createdBy: string;
  updatedBy: string;
}

export interface SeoGeneratedIdeaDoc extends SeoGeneratedIdeaAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SeoGeneratedIdeaSchema = new Schema<SeoGeneratedIdeaDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    clusterTitle: { type: String, default: null },
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

export const SeoGeneratedIdea: Model<SeoGeneratedIdeaDoc> = model<SeoGeneratedIdeaDoc>(
  "SeoGeneratedIdea",
  SeoGeneratedIdeaSchema
);


