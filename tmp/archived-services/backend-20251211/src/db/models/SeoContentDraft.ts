import { Schema, model, type Document, type Model } from "mongoose";

export type ContentDraftStatus = "generated" | "edited" | "published";
export type ContentDraftType = "article" | "website_page";

export interface SeoContentDraftAttrs {
  projectId: string;
  hypothesisId: string;
  ideaId: string;
  contentType: ContentDraftType;
  title: string;
  summary: string;
  body: string;
  structure: Record<string, any>;
  status: ContentDraftStatus;
  generationModel?: string;
  prompt?: string;
  createdBy: string;
  updatedBy: string;
  publishedAt?: Date | null;
}

export interface SeoContentDraftDoc extends SeoContentDraftAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SeoContentDraftSchema = new Schema<SeoContentDraftDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    ideaId: { type: String, required: true, unique: true, index: true },
    contentType: {
      type: String,
      enum: ["article", "website_page"],
      default: "article"
    },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    body: { type: String, required: true },
    structure: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ["generated", "edited", "published"],
      default: "generated"
    },
    publishedAt: { type: Date, default: null },
    generationModel: { type: String },
    prompt: { type: String },
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

SeoContentDraftSchema.index({ projectId: 1, hypothesisId: 1, status: 1 });

export const SeoContentDraft: Model<SeoContentDraftDoc> = model<SeoContentDraftDoc>(
  "SeoContentDraft",
  SeoContentDraftSchema
);


