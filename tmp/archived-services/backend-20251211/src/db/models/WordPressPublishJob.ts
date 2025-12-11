import { Schema, model, type Document, type Model } from "mongoose";

export type WordPressJobStatus = "queued" | "publishing" | "published" | "failed";

export interface WordPressPublishJobAttrs {
  draftId: string;
  ideaId: string;
  projectId: string;
  hypothesisId: string;
  targetSite: string;
  status: WordPressJobStatus;
  publishAt: Date;
  postId?: number | null;
  postUrl?: string | null;
  message?: string | null;
  payload?: Record<string, any> | null;
  error?: string | null;
  createdBy: string;
  startedAt?: Date | null;
  finishedAt?: Date | null;
}

export interface WordPressPublishJobDoc
  extends WordPressPublishJobAttrs,
    Document {
  createdAt: Date;
  updatedAt: Date;
}

const WordPressPublishJobSchema = new Schema<WordPressPublishJobDoc>(
  {
    draftId: { type: String, required: true, index: true },
    ideaId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    targetSite: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "publishing", "published", "failed"],
      default: "queued"
    },
    publishAt: { type: Date, required: true, index: true },
    postId: { type: Number, default: null },
    postUrl: { type: String, default: null },
    message: { type: String, default: null },
    payload: { type: Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    createdBy: { type: String, required: true },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null }
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

WordPressPublishJobSchema.index({ publishAt: 1, status: 1 });
WordPressPublishJobSchema.index({ draftId: 1, createdAt: -1 });

export const WordPressPublishJob: Model<WordPressPublishJobDoc> = model<WordPressPublishJobDoc>(
  "WordPressPublishJob",
  WordPressPublishJobSchema
);
