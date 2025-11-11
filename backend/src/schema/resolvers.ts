import { GraphQLScalarType, Kind } from "graphql";

import {
  SeoBacklogIdea,
  type SeoBacklogIdeaDoc
} from "../db/models/SeoBacklogIdea.js";
import {
  SeoCluster,
  type SeoClusterDoc,
  type SeoClusterIntent
} from "../db/models/SeoCluster.js";
import {
  SeoContentItem,
  type SeoContentItemDoc
} from "../db/models/SeoContentItem.js";

type BacklogCategory = SeoBacklogIdeaDoc["category"];
type ContentCategory = SeoContentItemDoc["category"];

const toUpperEnum = (value: string) => value.toUpperCase();
const toLowerEnum = (value: string) => value.toLowerCase();

const mapCluster = (doc: SeoClusterDoc) => ({
  id: doc.id,
  projectId: doc.projectId,
  hypothesisId: doc.hypothesisId,
  title: doc.title,
  intent: toUpperEnum(doc.intent),
  keywords: doc.keywords,
  createdBy: doc.createdBy,
  updatedBy: doc.updatedBy,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const mapBacklogIdea = (doc: SeoBacklogIdeaDoc) => ({
  id: doc.id,
  projectId: doc.projectId,
  hypothesisId: doc.hypothesisId,
  clusterId: doc.clusterId ?? null,
  title: doc.title,
  description: doc.description,
  category: toUpperEnum(doc.category),
  status: toUpperEnum(doc.status),
  createdBy: doc.createdBy,
  updatedBy: doc.updatedBy,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const mapContentItem = (doc: SeoContentItemDoc) => ({
  id: doc.id,
  projectId: doc.projectId,
  hypothesisId: doc.hypothesisId,
  backlogIdeaId: doc.backlogIdeaId ?? null,
  title: doc.title,
  category: toUpperEnum(doc.category),
  format: doc.format === "commercial" ? "COMMERCIAL" : doc.format.toUpperCase(),
  ownerId: doc.ownerId ?? null,
  reviewerId: doc.reviewerId ?? null,
  channel: doc.channel ?? null,
  outline: doc.outline ?? null,
  status: toUpperEnum(doc.status),
  dueDate: doc.dueDate ?? null,
  createdBy: doc.createdBy,
  updatedBy: doc.updatedBy,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

export const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 datetime scalar",
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === "string") {
      return new Date(value).toISOString();
    }
    throw new TypeError("DateTime serialization expected Date or string");
  },
  parseValue(value: unknown) {
    if (typeof value === "string" || typeof value === "number") {
      return new Date(value);
    }
    throw new TypeError("DateTime parsing expected string or number");
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    return null;
  }
});

export const resolvers = {
  DateTime: DateTimeScalar,
  Query: {
    _health: () => "ok",
    seoClusters: async (
      _: unknown,
      args: { projectId: string; hypothesisId: string }
    ) => {
      const docs = await SeoCluster.find({
        projectId: args.projectId,
        hypothesisId: args.hypothesisId
      })
        .sort({ updatedAt: -1 })
        .exec();
      return docs.map(mapCluster);
    },
    seoBacklog: async (
      _: unknown,
      args: { projectId: string; hypothesisId: string; status?: string }
    ) => {
      const query: Record<string, unknown> = {
        projectId: args.projectId,
        hypothesisId: args.hypothesisId
      };
      if (args.status) {
        query.status = toLowerEnum(args.status);
      }
      const docs = await SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      return docs.map(mapBacklogIdea);
    },
    seoContentQueue: async (
      _: unknown,
      args: { projectId: string; hypothesisId: string; status?: string }
    ) => {
      const query: Record<string, unknown> = {
        projectId: args.projectId,
        hypothesisId: args.hypothesisId
      };
      if (args.status) {
        query.status = toLowerEnum(args.status);
      }
      const docs = await SeoContentItem.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      return docs.map(mapContentItem);
    }
  },
  Mutation: {
    upsertSeoCluster: async (
      _: unknown,
      { input }: { input: any }
    ): Promise<ReturnType<typeof mapCluster>> => {
      const {
        id,
        projectId,
        hypothesisId,
        title,
        intent,
        keywords,
        userId
      } = input;

      const payload: Partial<SeoClusterDoc> = {
        projectId,
        hypothesisId,
        title,
        intent: toLowerEnum(intent) as SeoClusterIntent,
        keywords,
        updatedBy: userId
      };

      let doc: SeoClusterDoc | null = null;
      if (id) {
        doc = await SeoCluster.findByIdAndUpdate(
          id,
          { ...payload },
          { new: true }
        ).exec();
      } else {
        doc = await SeoCluster.create({
          ...payload,
          createdBy: userId,
          updatedBy: userId
        });
      }
      if (!doc) {
        throw new Error("Failed to upsert cluster");
      }
      return mapCluster(doc);
    },
    deleteSeoCluster: async (_: unknown, { id }: { id: string }) => {
      const res = await SeoCluster.findByIdAndDelete(id).exec();
      return Boolean(res);
    },
    upsertBacklogIdea: async (
      _: unknown,
      { input }: { input: any }
    ): Promise<ReturnType<typeof mapBacklogIdea>> => {
      const {
        id,
        userId,
        projectId,
        hypothesisId,
        clusterId,
        title,
        description,
        category,
        status
      } = input;
      const payload = {
        projectId,
        hypothesisId,
        clusterId,
        title,
        description,
        category: toLowerEnum(category) as BacklogCategory,
        status: (status
          ? toLowerEnum(status)
          : "backlog") as SeoBacklogIdeaDoc["status"],
        updatedBy: userId
      };
      let doc: SeoBacklogIdeaDoc | null = null;
      if (id) {
        doc = await SeoBacklogIdea.findByIdAndUpdate(
          id,
          payload,
          { new: true }
        ).exec();
      } else {
        doc = await SeoBacklogIdea.create({
          ...payload,
          createdBy: userId
        });
      }
      if (!doc) {
        throw new Error("Failed to upsert backlog idea");
      }
      return mapBacklogIdea(doc);
    },
    deleteBacklogIdea: async (_: unknown, { id }: { id: string }) => {
      const res = await SeoBacklogIdea.findByIdAndDelete(id).exec();
      return Boolean(res);
    },
    upsertContentItem: async (
      _: unknown,
      { input }: { input: any }
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const {
        id,
        projectId,
        hypothesisId,
        backlogIdeaId,
        title,
        category,
        format,
        ownerId,
        reviewerId,
        channel,
        outline,
        status,
        dueDate,
        userId
      } = input;
      const payload = {
        projectId,
        hypothesisId,
        backlogIdeaId,
        title,
        category: toLowerEnum(category) as ContentCategory,
        format: (format === "COMMERCIAL"
          ? "commercial"
          : format === "FAQ"
          ? "faq"
          : "blog") as SeoContentItemDoc["format"],
        ownerId,
        reviewerId,
        channel,
        outline,
        status: (status
          ? toLowerEnum(status)
          : "draft") as SeoContentItemDoc["status"],
        dueDate: dueDate ? new Date(dueDate) : undefined,
        updatedBy: userId
      };
      let doc: SeoContentItemDoc | null = null;
      if (id) {
        doc = await SeoContentItem.findByIdAndUpdate(
          id,
          payload,
          { new: true }
        ).exec();
      } else {
        doc = await SeoContentItem.create({
          ...payload,
          createdBy: userId
        });
      }
      if (!doc) {
        throw new Error("Failed to upsert content item");
      }
      return mapContentItem(doc);
    },
    deleteContentItem: async (_: unknown, { id }: { id: string }) => {
      const res = await SeoContentItem.findByIdAndDelete(id).exec();
      return Boolean(res);
    }
  }
};

