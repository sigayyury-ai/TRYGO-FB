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
import {
  SeoSprintSettings,
  type SeoSprintSettingsDocument
} from "../db/models/SeoSprintSettings.js";

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
  hypothesisId: doc.hypothesisId ?? null,
  clusterId: doc.clusterId ?? null,
  title: doc.title,
  description: doc.description ?? null,
  contentType: "ARTICLE" as const, // Default, can be extended later
  category: doc.category ? toUpperEnum(doc.category) : null,
  status: mapBacklogStatus(doc.status),
  scheduledDate: (doc as any).scheduledDate ?? null,
  createdBy: doc.createdBy ?? null,
  updatedBy: doc.updatedBy ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

const mapBacklogStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    backlog: "PENDING",
    scheduled: "SCHEDULED",
    archived: "ARCHIVED"
  };
  return statusMap[status.toLowerCase()] || toUpperEnum(status);
};

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
  content: (doc as any).content ?? null,
  imageUrl: (doc as any).imageUrl ?? null,
  status: toUpperEnum(doc.status),
  dueDate: doc.dueDate ?? null,
  createdBy: doc.createdBy,
  updatedBy: doc.updatedBy,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
});

// Map SeoContentItem to ContentIdea for seoAgentContentIdeas query
const mapContentIdea = (doc: SeoContentItemDoc) => {
  // Map format to contentType
  let contentType: string;
  if (doc.format === "commercial") {
    contentType = "COMMERCIAL_PAGE";
  } else if (doc.format === "faq") {
    contentType = "ARTICLE"; // FAQ articles are articles
  } else {
    contentType = "ARTICLE";
  }

  // Map category
  const categoryMap: Record<string, string> = {
    pain: "PAINS",
    goal: "GOALS",
    trigger: "TRIGGERS",
    feature: "PRODUCT_FEATURES",
    benefit: "BENEFITS",
    faq: "FAQS",
    info: "INFORMATIONAL"
  };
  const category = categoryMap[doc.category] || toUpperEnum(doc.category);

  // Map status
  const statusMap: Record<string, string> = {
    draft: "NEW",
    review: "NEW",
    ready: "NEW",
    published: "ADDED_TO_BACKLOG",
    archived: "DISMISSED" // archived status means dismissed
  };
  const status = statusMap[doc.status] || "NEW";
  const dismissed = doc.status === "archived";

  return {
    id: doc.id,
    projectId: doc.projectId,
    hypothesisId: doc.hypothesisId || undefined,
    title: doc.title,
    description: doc.outline || undefined,
    category,
    contentType,
    clusterId: undefined, // TODO: Add clusterId to SeoContentItem if needed
    status,
    dismissed,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

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
    contentItemByBacklogIdea: async (
      _: unknown,
      { backlogIdeaId }: { backlogIdeaId: string }
    ): Promise<ReturnType<typeof mapContentItem> | null> => {
      const doc = await SeoContentItem.findOne({ backlogIdeaId }).exec();
      if (!doc) {
        return null;
      }
      return mapContentItem(doc);
    },
    seoClusters: async (
      _: unknown,
      args: { projectId: string; hypothesisId?: string }
    ) => {
      const query: Record<string, unknown> = {
        projectId: args.projectId
      };
      if (args.hypothesisId) {
        query.hypothesisId = args.hypothesisId;
      }
      const docs = await SeoCluster.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      return docs.map(mapCluster);
    },
    seoAgentClusters: async (
      _: unknown,
      args: { projectId: string; hypothesisId?: string }
    ) => {
      const query: Record<string, unknown> = {
        projectId: args.projectId
      };
      if (args.hypothesisId) {
        query.hypothesisId = args.hypothesisId;
      }
      const docs = await SeoCluster.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      return docs.map(mapCluster);
    },
    seoBacklog: async (
      _: unknown,
      args: { projectId: string; hypothesisId?: string; status?: string }
    ) => {
      const query: Record<string, unknown> = {
        projectId: args.projectId
      };
      if (args.hypothesisId) {
        query.hypothesisId = args.hypothesisId;
      }
      if (args.status) {
        query.status = toLowerEnum(args.status);
      }
      const docs = await SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      return docs.map(mapBacklogIdea);
    },
    seoAgentBacklog: async (
      _: unknown,
      args: { projectId: string; hypothesisId?: string }
    ) => {
      console.log("[seoAgentBacklog] Query with args:", {
        projectId: args.projectId,
        hypothesisId: args.hypothesisId
      });
      
      const query: Record<string, unknown> = {
        projectId: args.projectId
      };
      
      // If hypothesisId is provided, filter by it
      // If not provided, get all items for the project (hypothesisId can be null/undefined in DB)
      if (args.hypothesisId && args.hypothesisId.trim() !== "") {
        query.hypothesisId = args.hypothesisId;
      }
      
      console.log("[seoAgentBacklog] MongoDB query:", query);
      
      const docs = await SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      
      console.log(`[seoAgentBacklog] Found ${docs.length} items for projectId: ${args.projectId}, hypothesisId: ${args.hypothesisId || "all"}`);
      
      if (docs.length > 0) {
        console.log("[seoAgentBacklog] Sample items:", docs.slice(0, 3).map(d => ({
          id: d.id,
          title: d.title,
          projectId: d.projectId,
          hypothesisId: d.hypothesisId,
          status: d.status
        })));
      }
      
      return docs.map(mapBacklogIdea);
    },
    seoAgentContentIdeas: async (
      _: unknown,
      args: { projectId: string; hypothesisId?: string }
    ) => {
      console.log("Fetching seoAgentContentIdeas for projectId:", args.projectId, "hypothesisId:", args.hypothesisId);
      const query: Record<string, unknown> = { projectId: args.projectId };
      if (args.hypothesisId) {
        query.hypothesisId = args.hypothesisId;
      }
      const docs = await SeoContentItem.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      console.log(`Found ${docs.length} content items`);
      return docs.map(mapContentIdea);
    },
    seoAgentPostingSettings: async (
      _: unknown,
      args: { projectId: string }
    ) => {
      console.log("Fetching seoAgentPostingSettings for projectId:", args.projectId);
      
      // Use existing SeoSprintSettings model
      const settings = await SeoSprintSettings.findOne({ projectId: args.projectId }).exec();
      
      if (settings) {
        // Map publishDays (numbers 0-6) to day names
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const preferredDays = settings.publishDays.map(day => dayNames[day] || `Day ${day}`);
        
        return {
          id: settings.id,
          projectId: settings.projectId,
          hypothesisId: settings.hypothesisId || null,
          weeklyPublishCount: settings.weeklyCadence,
          preferredDays,
          autoPublishEnabled: false, // Not in SeoSprintSettings model yet
          createdAt: settings.createdAt,
          updatedAt: settings.updatedAt
        };
      }
      
      // Return default settings if not found
      return {
        id: `posting-settings-${args.projectId}`,
        projectId: args.projectId,
        hypothesisId: null,
        weeklyPublishCount: 2,
        preferredDays: ["Tuesday", "Thursday"],
        autoPublishEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    },
    seoContentQueue: async (
      _: unknown,
      args: { projectId: string; hypothesisId?: string; status?: string }
    ) => {
      const query: Record<string, unknown> = {
        projectId: args.projectId
      };
      if (args.hypothesisId) {
        query.hypothesisId = args.hypothesisId;
      }
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
    createSeoAgentCluster: async (
      _: unknown,
      { input }: { input: any }
    ): Promise<ReturnType<typeof mapCluster>> => {
      const {
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

      const doc = await SeoCluster.create({
        ...payload,
        createdBy: userId,
        updatedBy: userId
      });
      return mapCluster(doc);
    },
    updateSeoAgentCluster: async (
      _: unknown,
      { id, input }: { id: string; input: any }
    ): Promise<ReturnType<typeof mapCluster>> => {
      const {
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

      const doc = await SeoCluster.findByIdAndUpdate(
        id,
        { ...payload },
        { new: true }
      ).exec();
      
      if (!doc) {
        throw new Error("Failed to update cluster");
      }
      return mapCluster(doc);
    },
    deleteSeoAgentCluster: async (_: unknown, { id }: { id: string }) => {
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
    updateSeoAgentBacklogIdea: async (
      _: unknown,
      { id, input }: { id: string; input: any },
      context: any
    ): Promise<ReturnType<typeof mapBacklogIdea>> => {
      const doc = await SeoBacklogIdea.findById(id).exec();
      if (!doc) {
        throw new Error("Backlog idea not found");
      }

      const userId = context?.userId || doc.updatedBy || "system";

      const payload: Partial<SeoBacklogIdeaDoc> = {
        title: input.title,
        description: input.description ?? doc.description,
        status: input.status ? toLowerEnum(input.status) as SeoBacklogIdeaDoc["status"] : doc.status,
        clusterId: input.clusterId ?? doc.clusterId,
        updatedBy: userId
      };

      // Handle scheduledDate if provided
      if (input.scheduledDate !== undefined) {
        (payload as any).scheduledDate = input.scheduledDate ? new Date(input.scheduledDate) : null;
      }

      const updated = await SeoBacklogIdea.findByIdAndUpdate(id, payload, { new: true }).exec();
      if (!updated) {
        throw new Error("Failed to update backlog idea");
      }
      return mapBacklogIdea(updated);
    },
    deleteSeoAgentBacklogIdea: async (_: unknown, { id }: { id: string }) => {
      const res = await SeoBacklogIdea.findByIdAndDelete(id).exec();
      return Boolean(res);
    },
    addContentIdeaToBacklog: async (
      _: unknown,
      { input }: { input: any },
      context: any
    ): Promise<ReturnType<typeof mapBacklogIdea>> => {
      // Get projectId and hypothesisId from the content idea
      const contentIdea = await SeoContentItem.findById(input.contentIdeaId).exec();
      if (!contentIdea) {
        throw new Error("Content idea not found");
      }

      const userId = context?.userId || contentIdea.createdBy || "system";

      // Map contentType to category
      const categoryMap: Record<string, BacklogCategory> = {
        ARTICLE: "info",
        COMMERCIAL_PAGE: "feature",
        LANDING_PAGE: "feature"
      };
      const category = categoryMap[input.contentType] || "info";

      const doc = await SeoBacklogIdea.create({
        projectId: contentIdea.projectId,
        hypothesisId: contentIdea.hypothesisId,
        title: input.title,
        description: input.description || "",
        category: category as BacklogCategory,
        status: "backlog" as SeoBacklogIdeaDoc["status"],
        clusterId: input.clusterId,
        createdBy: userId,
        updatedBy: userId
      });

      // Update content idea status to ADDED_TO_BACKLOG
      await SeoContentItem.findByIdAndUpdate(
        input.contentIdeaId,
        { 
          status: "published" as SeoContentItemDoc["status"], // Using published as marker for added to backlog
          updatedBy: userId
        },
        { new: true }
      ).exec();

      return mapBacklogIdea(doc);
    },
    dismissContentIdea: async (
      _: unknown,
      { id }: { id: string }
    ) => {
      // Use existing SeoContentItem model
      const contentItem = await SeoContentItem.findByIdAndUpdate(
        id,
        { status: "archived" as SeoContentItemDoc["status"] }, // Using archived status as dismissed
        { new: true }
      ).exec();

      if (!contentItem) {
        throw new Error("Content idea not found");
      }

      return mapContentIdea(contentItem);
    },
    createCustomContentIdea: async (
      _: unknown,
      { input }: { input: any },
      context: any
    ) => {
      // Use existing SeoContentItem model
      // Map category from ContentCategory to SeoContentItem category
      const categoryMap: Record<string, ContentCategory> = {
        PAINS: "pain",
        GOALS: "goal",
        TRIGGERS: "trigger",
        PRODUCT_FEATURES: "feature",
        BENEFITS: "benefit",
        FAQS: "faq",
        INFORMATIONAL: "info"
      };
      const category = categoryMap[input.category] || "info";

      // Map contentType to format
      const formatMap: Record<string, SeoContentItemDoc["format"]> = {
        ARTICLE: "blog",
        COMMERCIAL_PAGE: "commercial",
        LANDING_PAGE: "commercial"
      };
      const format = formatMap[input.contentType] || "blog";

      const userId = context?.userId || "system";

      const doc = await SeoContentItem.create({
        projectId: input.projectId,
        hypothesisId: input.hypothesisId || "",
        title: input.title,
        outline: input.description || "",
        category: category as ContentCategory,
        format: format,
        status: "draft" as SeoContentItemDoc["status"],
        createdBy: userId,
        updatedBy: userId
      });

      return mapContentIdea(doc);
    },
    updateSeoAgentPostingSettings: async (
      _: unknown,
      { input }: { input: any },
      context: any
    ) => {
      console.log("Updating seoAgentPostingSettings for projectId:", input.projectId);
      
      const userId = context?.userId || "system";
      
      // Map day names to numbers (0-6)
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const publishDays = input.preferredDays.map((dayName: string) => {
        const index = dayNames.findIndex(day => day.toLowerCase() === dayName.toLowerCase());
        return index >= 0 ? index : 1; // Default to Monday if not found
      });
      
      // Use existing SeoSprintSettings model
      const settings = await SeoSprintSettings.findOneAndUpdate(
        { 
          projectId: input.projectId,
          hypothesisId: input.hypothesisId || ""
        },
        {
          projectId: input.projectId,
          hypothesisId: input.hypothesisId || "",
          weeklyCadence: input.weeklyPublishCount,
          publishDays,
          updatedBy: userId
        },
        { 
          upsert: true, 
          new: true 
        }
      ).exec();
      
      if (!settings) {
        throw new Error("Failed to update posting settings");
      }
      
      // Map back to PostingSettings format
      const preferredDays = settings.publishDays.map(day => dayNames[day] || `Day ${day}`);
      
      return {
        id: settings.id,
        projectId: settings.projectId,
        hypothesisId: settings.hypothesisId || null,
        weeklyPublishCount: settings.weeklyCadence,
        preferredDays,
        autoPublishEnabled: input.autoPublishEnabled || false, // Not stored in SeoSprintSettings yet
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt
      };
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
        content: input.content,
        imageUrl: input.imageUrl,
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
    },
    generateContentForBacklogIdea: async (
      _: unknown,
      { input }: { input: any },
      context: any
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const { backlogIdeaId, projectId, hypothesisId } = input;
      const userId = context?.userId || "system";

      // Get backlog idea
      const backlogIdea = await SeoBacklogIdea.findById(backlogIdeaId).exec();
      if (!backlogIdea) {
        throw new Error("Backlog idea not found");
      }

      // Import generation service
      const { generateContent } = await import("../services/contentGeneration.js");

      // Get cluster context if available
      let clusterContext = null;
      if (backlogIdea.clusterId) {
        const cluster = await SeoCluster.findById(backlogIdea.clusterId).exec();
        if (cluster) {
          clusterContext = {
            title: cluster.title,
            intent: cluster.intent,
            keywords: cluster.keywords
          };
        }
      }

      // Generate content using new prompt system
      const generated = await generateContent({
        title: backlogIdea.title,
        description: backlogIdea.description || undefined,
        category: backlogIdea.category || "info",
        contentType: "ARTICLE", // Default to ARTICLE, can be extended
        projectContext: {}, // Fallback for old system
        hypothesisContext: {}, // Fallback for old system
        clusterContext,
        // New: use new prompt system
        backlogIdeaId: backlogIdea.id,
        projectId,
        hypothesisId: hypothesisId || backlogIdea.hypothesisId
      });

      // Map category
      const categoryMap: Record<string, ContentCategory> = {
        PAIN: "pain",
        GOAL: "goal",
        TRIGGER: "trigger",
        FEATURE: "feature",
        BENEFIT: "benefit",
        FAQ: "faq",
        INFO: "info"
      };
      const category = categoryMap[backlogIdea.category?.toUpperCase() || "INFO"] || "info";

      // Create or update content item
      const existingItem = await SeoContentItem.findOne({ backlogIdeaId }).exec();
      
      let doc: SeoContentItemDoc;
      if (existingItem) {
        doc = await SeoContentItem.findByIdAndUpdate(
          existingItem.id,
          {
            title: backlogIdea.title,
            outline: generated.outline || backlogIdea.description || "",
            content: generated.content,
            status: "draft" as SeoContentItemDoc["status"],
            updatedBy: userId
          },
          { new: true }
        ).exec() as SeoContentItemDoc;
      } else {
        doc = await SeoContentItem.create({
          projectId,
          hypothesisId: hypothesisId || backlogIdea.hypothesisId || "",
          backlogIdeaId,
          title: backlogIdea.title,
          category: category as ContentCategory,
          format: "blog" as SeoContentItemDoc["format"],
          outline: generated.outline || backlogIdea.description || "",
          content: generated.content,
          status: "draft" as SeoContentItemDoc["status"],
          createdBy: userId,
          updatedBy: userId
        });
      }

      if (!doc) {
        throw new Error("Failed to create content item");
      }

      return mapContentItem(doc);
    },
    generateImageForContent: async (
      _: unknown,
      { input }: { input: any },
      context: any
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const { contentItemId, title, description } = input;
      const userId = context?.userId || "system";

      // Get content item
      const contentItem = await SeoContentItem.findById(contentItemId).exec();
      if (!contentItem) {
        throw new Error("Content item not found");
      }

      // Import generation service
      const { generateImage } = await import("../services/contentGeneration.js");

      // Generate image
      const imageResult = await generateImage({
        title,
        description,
        content: (contentItem as any).content
      });

      // Update content item with image URL
      const updated = await SeoContentItem.findByIdAndUpdate(
        contentItemId,
        {
          imageUrl: imageResult.imageUrl,
          updatedBy: userId
        },
        { new: true }
      ).exec();

      if (!updated) {
        throw new Error("Failed to update content item with image");
      }

      return mapContentItem(updated);
    },
    regenerateContent: async (
      _: unknown,
      { id, promptPart }: { id: string; promptPart?: string },
      context: any
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const userId = context?.userId || "system";

      // Get content item
      const { contentItemId } = input;
      const contentItem = await SeoContentItem.findById(contentItemId).exec();
      if (!contentItem) {
        throw new Error("Content item not found");
      }

      // Get backlog idea if available
      let backlogIdea = null;
      if (contentItem.backlogIdeaId) {
        backlogIdea = await SeoBacklogIdea.findById(contentItem.backlogIdeaId).exec();
      }

      // Get cluster context if available
      let clusterContext = null;
      if (backlogIdea?.clusterId) {
        const cluster = await SeoCluster.findById(backlogIdea.clusterId).exec();
        if (cluster) {
          clusterContext = {
            title: cluster.title,
            intent: cluster.intent,
            keywords: cluster.keywords
          };
        }
      }

      // Import generation service
      const { generateContent } = await import("../services/contentGeneration.js");

      // Build prompt with optional promptPart
      const basePrompt = promptPart || `Regenerate the content for "${contentItem.title}" with improvements and better structure.`;

      // Generate new content
      const generated = await generateContent({
        title: contentItem.title,
        description: contentItem.outline || undefined,
        category: contentItem.category || "info",
        contentType: contentItem.format === "commercial" ? "COMMERCIAL_PAGE" : "ARTICLE",
        projectContext: {}, // TODO: Load from main backend
        hypothesisContext: {}, // TODO: Load from main backend
        clusterContext
      });

      // Update content item with regenerated content
      const updated = await SeoContentItem.findByIdAndUpdate(
        id,
        {
          content: generated.content,
          outline: generated.outline || contentItem.outline,
          updatedBy: userId
        },
        { new: true }
      ).exec();

      if (!updated) {
        throw new Error("Failed to update content item");
      }

      return mapContentItem(updated);
    },
    approveContentItem: async (
      _: unknown,
      { input }: { input: { contentItemId: string; projectId: string; hypothesisId?: string } },
      context: any
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const userId = context?.userId || "system";

      // Update status to "ready" (approved and ready for publishing)
      const updated = await SeoContentItem.findByIdAndUpdate(
        id,
        {
          status: "ready" as SeoContentItemDoc["status"],
          updatedBy: userId
        },
        { new: true }
      ).exec();

      if (!updated) {
        throw new Error("Content item not found");
      }

      return mapContentItem(updated);
    }
  }
};

