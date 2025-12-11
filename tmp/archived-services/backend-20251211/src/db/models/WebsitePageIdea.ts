import { Schema, model, type Document, type Model } from "mongoose";

export type WebsitePageStatus = "generated" | "backlog" | "archived";

export interface WebsitePageStructure {
  sections: Array<{
    key: string;
    heading: string;
    body: string;
    notes?: string;
    design?: string;
  }>;
  hero?: Record<string, any> | null;
  proof?: Array<Record<string, any>>;
  faq?: Array<Record<string, any>>;
  cta?: Record<string, any> | null;
  seo?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
}

export interface WebsitePageIdeaAttrs {
  projectId: string;
  hypothesisId: string;
  clusterId: string;
  title: string;
  summary: string;
  personaFocus?: string | null;
  funnelStage?: string | null;
  status: WebsitePageStatus;
  structure: WebsitePageStructure;
  generationModel?: string;
  prompt?: string;
  createdBy: string;
  updatedBy: string;
  contentItemId?: string | null;
}

export interface WebsitePageIdeaDoc extends WebsitePageIdeaAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema(
  {
    key: { type: String, required: true },
    heading: { type: String, required: true },
    body: { type: String, required: true },
    notes: { type: String },
    design: { type: String }
  },
  { _id: false }
);

const WebsitePageIdeaSchema = new Schema<WebsitePageIdeaDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    clusterId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    personaFocus: { type: String },
    funnelStage: { type: String },
    status: {
      type: String,
      enum: ["generated", "backlog", "archived"],
      default: "generated"
    },
    structure: {
      sections: { type: [SectionSchema], default: [] },
      hero: { type: Schema.Types.Mixed, default: null },
      proof: { type: [Schema.Types.Mixed], default: [] },
      faq: { type: [Schema.Types.Mixed], default: [] },
      cta: { type: Schema.Types.Mixed, default: null },
      seo: { type: Schema.Types.Mixed, default: null },
      metadata: { type: Schema.Types.Mixed, default: null }
    },
    generationModel: { type: String },
    prompt: { type: String },
    contentItemId: { type: String, default: null },
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

WebsitePageIdeaSchema.index({ projectId: 1, hypothesisId: 1, status: 1 });

export const WebsitePageIdea: Model<WebsitePageIdeaDoc> = model<WebsitePageIdeaDoc>(
  "WebsitePageIdea",
  WebsitePageIdeaSchema
);
