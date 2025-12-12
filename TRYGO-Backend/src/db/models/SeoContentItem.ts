import { Schema, model, type Document, type Model } from "mongoose";

export type ContentStatus = "draft" | "review" | "ready" | "published" | "archived";

export type ContentCategory =
  | "pain"
  | "goal"
  | "trigger"
  | "feature"
  | "benefit"
  | "faq"
  | "info";

export interface SeoContentItemAttrs {
  projectId: string;
  hypothesisId: string;
  backlogIdeaId?: string;
  title: string;
  category: ContentCategory;
  format: "blog" | "commercial" | "faq";
  ownerId?: string;
  reviewerId?: string;
  channel?: string;
  outline?: string;
  content?: string; // Full generated article content
  imageUrl?: string; // Generated image URL
  status: ContentStatus;
  createdBy: string;
  updatedBy: string;
  dueDate?: Date;
}

export interface SeoContentItemDoc extends SeoContentItemAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SeoContentItemSchema = new Schema<SeoContentItemDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    backlogIdeaId: { type: String },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["pain", "goal", "trigger", "feature", "benefit", "faq", "info"],
      required: true
    },
    format: {
      type: String,
      enum: ["blog", "commercial", "faq"],
      required: true,
      default: "blog"
    },
    ownerId: { type: String },
    reviewerId: { type: String },
    channel: { type: String },
    outline: { type: String },
    content: { type: String }, // Full generated article content
    imageUrl: { type: String }, // Generated image URL
    status: {
      type: String,
      enum: ["draft", "review", "ready", "published", "archived"],
      default: "draft",
      index: true
    },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    dueDate: { type: Date }
  },
  { timestamps: true }
);

// Compound index for efficient queries
SeoContentItemSchema.index({ projectId: 1, hypothesisId: 1 });

export const SeoContentItem: Model<SeoContentItemDoc> = model<SeoContentItemDoc>(
  "SeoContentItem",
  SeoContentItemSchema
);

