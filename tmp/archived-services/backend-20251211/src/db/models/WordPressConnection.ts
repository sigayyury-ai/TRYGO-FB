import { Schema, model, type Document, type Model } from "mongoose";

export type WordPressDefaultStatus = "draft" | "publish" | "pending";

export interface WordPressConnectionAttrs {
  key: string;
  baseUrl: string;
  username: string;
  appPassword: string;
  defaultStatus: WordPressDefaultStatus;
  articleCategoryId?: number | null;
  pageCategoryId?: number | null;
  articleTagIds?: number[];
  pageTagIds?: number[];
  articlePostType?: string;
  pagePostType?: string;
}

export interface WordPressConnectionDoc extends WordPressConnectionAttrs, Document {
  createdAt: Date;
  updatedAt: Date;
}

const WordPressConnectionSchema = new Schema<WordPressConnectionDoc>(
  {
    key: { type: String, required: true, unique: true },
    baseUrl: { type: String, required: true },
    username: { type: String, required: true },
    appPassword: { type: String, required: true },
    defaultStatus: {
      type: String,
      enum: ["draft", "publish", "pending"],
      default: "draft"
    },
    articleCategoryId: { type: Number, default: null },
    pageCategoryId: { type: Number, default: null },
    articleTagIds: { type: [Number], default: [] },
    pageTagIds: { type: [Number], default: [] },
    articlePostType: { type: String, default: "posts" },
    pagePostType: { type: String, default: "pages" }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.appPassword;
        return ret;
      }
    }
  }
);

export const WordPressConnection: Model<WordPressConnectionDoc> = model<WordPressConnectionDoc>(
  "WordPressConnection",
  WordPressConnectionSchema
);
