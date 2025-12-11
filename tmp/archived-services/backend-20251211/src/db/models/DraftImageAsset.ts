import { Schema, model, type Document, type Model } from "mongoose";

export type DraftImageKind = "hero" | "inline";
export type DraftImageProvider = "openai" | "gemini";

export interface DraftImageAssetAttrs {
  projectId: string;
  hypothesisId: string;
  ideaId: string;
  draftId: string;
  type: DraftImageKind;
  provider: DraftImageProvider;
  prompt: string;
  negativePrompt?: string | null;
  style: string;
  aspectRatio: string;
  storagePath: string;
  url: string;
  altText: string;
  createdBy: string;
  updatedBy: string;
}

export interface DraftImageAssetDoc extends DraftImageAssetAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const DraftImageAssetSchema = new Schema<DraftImageAssetDoc>(
  {
    projectId: { type: String, required: true, index: true },
    hypothesisId: { type: String, required: true, index: true },
    ideaId: { type: String, required: true, index: true },
    draftId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["hero", "inline"],
      default: "hero",
      required: true
    },
    provider: {
      type: String,
      enum: ["openai", "gemini"],
      default: "openai",
      required: true
    },
    prompt: { type: String, required: true },
    negativePrompt: { type: String, default: null },
    style: { type: String, default: "modern flat illustration" },
    aspectRatio: { type: String, default: "16:9" },
    storagePath: { type: String, required: true },
    url: { type: String, required: true },
    altText: { type: String, default: "" },
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

DraftImageAssetSchema.index({ draftId: 1, type: 1 }, { unique: true });

export const DraftImageAsset: Model<DraftImageAssetDoc> = model<DraftImageAssetDoc>(
  "DraftImageAsset",
  DraftImageAssetSchema
);


