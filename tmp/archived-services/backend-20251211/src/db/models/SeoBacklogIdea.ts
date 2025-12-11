import { Schema, model, type Document, type Model } from "mongoose";

export type BacklogIdeaStatus = "backlog" | "scheduled" | "archived" | "pending" | "in_progress" | "completed" | "published";

export interface SeoBacklogIdeaAttrs {
  projectId: string;
  hypothesisId: string;
  clusterId?: string;
  title: string;
  description: string;
  category: "pain" | "goal" | "trigger" | "feature" | "benefit" | "faq" | "info";
  status: BacklogIdeaStatus;
  scheduledDate?: Date;
  createdBy: string;
  updatedBy: string;
}

export interface SeoBacklogIdeaDoc extends SeoBacklogIdeaAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SeoBacklogIdeaSchema = new Schema<SeoBacklogIdeaDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    clusterId: { type: String },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["pain", "goal", "trigger", "feature", "benefit", "faq", "info"],
      required: true
    },
    status: {
      type: String,
      enum: ["backlog", "scheduled", "archived", "pending", "in_progress", "completed", "published"],
      default: "pending",
      index: true
    },
    scheduledDate: { type: Date },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true }
  },
  { timestamps: true }
);

export const SeoBacklogIdea: Model<SeoBacklogIdeaDoc> = model<SeoBacklogIdeaDoc>(
  "SeoBacklogIdea",
  SeoBacklogIdeaSchema
);

