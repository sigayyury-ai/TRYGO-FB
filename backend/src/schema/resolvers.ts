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
    archived: "ARCHIVED",
    pending: "PENDING",
    in_progress: "IN_PROGRESS",
    completed: "COMPLETED",
    published: "IN_PROGRESS" // Map published to IN_PROGRESS to keep in sprint
  };
  return statusMap[status.toLowerCase()] || toUpperEnum(status);
};

const mapContentItem = (doc: SeoContentItemDoc) => {
  // Map category from database format to GraphQL enum format
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

  return {
    id: doc.id,
    projectId: doc.projectId,
    hypothesisId: doc.hypothesisId,
    backlogIdeaId: doc.backlogIdeaId ?? null,
    title: doc.title,
    category,
    format: doc.format === "commercial" ? "COMMERCIAL_PAGE" : doc.format === "blog" ? "BLOG" : doc.format === "faq" ? "ARTICLE" : doc.format.toUpperCase(),
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
  };
};

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
      console.log("\n" + "=".repeat(80));
      console.log("[seoAgentBacklog] 🚀 НАЧАЛО ВЫПОЛНЕНИЯ РЕЗОЛВЕРА");
      console.log("=".repeat(80));
      console.log("[seoAgentBacklog] Query with args:", {
        projectId: args.projectId,
        hypothesisId: args.hypothesisId,
        projectIdType: typeof args.projectId,
        hypothesisIdType: typeof args.hypothesisId
      });
      
      // Проверка подключения к MongoDB
      const mongoose = await import("mongoose");
      console.log("[seoAgentBacklog] MongoDB connection state:", mongoose.default.connection.readyState);
      console.log("[seoAgentBacklog] MongoDB database:", mongoose.default.connection.db?.databaseName);
      console.log("[seoAgentBacklog] MongoDB host:", mongoose.default.connection.host);
      
      const query: Record<string, unknown> = {
        projectId: args.projectId
      };
      
      // If hypothesisId is provided, filter by it
      // If not provided, get all items for the project (hypothesisId can be null/undefined in DB)
      if (args.hypothesisId && args.hypothesisId.trim() !== "") {
        query.hypothesisId = args.hypothesisId;
      }
      
      console.log("[seoAgentBacklog] MongoDB query object:", JSON.stringify(query, null, 2));
      console.log("[seoAgentBacklog] Query keys:", Object.keys(query));
      console.log("[seoAgentBacklog] Query values:", Object.values(query));
      
      // Проверка countDocuments перед запросом
      console.log("[seoAgentBacklog] 🔍 Выполняю countDocuments()...");
      const totalCount = await SeoBacklogIdea.countDocuments(query);
      console.log(`[seoAgentBacklog] ✅ countDocuments() result: ${totalCount}`);
      
      // Дополнительная проверка через нативный драйвер
      const collection = mongoose.default.connection.db.collection("seobacklogideas");
      const nativeCount = await collection.countDocuments(query);
      console.log(`[seoAgentBacklog] ✅ Native MongoDB countDocuments() result: ${nativeCount}`);
      
      if (totalCount !== nativeCount) {
        console.warn(`[seoAgentBacklog] ⚠️ РАСХОЖДЕНИЕ: Mongoose count=${totalCount}, Native count=${nativeCount}`);
      }
      
      // Explicitly set no limit to ensure we get all items
      // Note: In Mongoose, limit(0) or no limit() should return all results
      // But if there's a default limit somewhere, we'll use a very high number
      console.log("[seoAgentBacklog] 🔍 Создаю query builder...");
      const queryBuilder = SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .limit(10000); // Use a very high limit instead of 0
      
      const queryOptions = queryBuilder.getOptions();
      console.log(`[seoAgentBacklog] Query builder options:`, {
        hasLimit: queryOptions.limit !== undefined,
        limit: queryOptions.limit,
        sort: queryOptions.sort,
        skip: queryOptions.skip,
        projection: queryOptions.projection
      });
      
      // Проверка на наличие плагинов
      const schema = SeoBacklogIdea.schema;
      console.log("[seoAgentBacklog] Schema plugins count:", schema.plugins.length);
      if (schema.plugins.length > 0) {
        console.log("[seoAgentBacklog] Schema plugins:", schema.plugins.map((p: any) => p.fn?.name || "anonymous"));
      }
      
      console.log("[seoAgentBacklog] 🔍 Выполняю find().exec()...");
      const docs = await queryBuilder.exec();
      
      console.log(`[seoAgentBacklog] ✅ Found ${docs.length} items (expected ${totalCount}) for projectId: ${args.projectId}, hypothesisId: ${args.hypothesisId || "all"}`);
      
      if (docs.length !== totalCount) {
        console.warn(`[seoAgentBacklog] ⚠️ WARNING: Found ${docs.length} items but countDocuments() returned ${totalCount}!`);
        console.warn(`[seoAgentBacklog] This suggests a limit is being applied somewhere.`);
        
        // Показываем первые и последние ID для сравнения
        if (docs.length > 0) {
          console.log(`[seoAgentBacklog] First doc ID: ${docs[0]._id}`);
          console.log(`[seoAgentBacklog] Last doc ID: ${docs[docs.length - 1]._id}`);
        }
        
        // Пробуем получить через нативный драйвер
        console.log("[seoAgentBacklog] 🔍 Пробую получить через нативный MongoDB драйвер...");
        const nativeDocs = await collection.find(query)
          .sort({ updatedAt: -1 })
          .limit(10000)
          .toArray();
        console.log(`[seoAgentBacklog] ✅ Native MongoDB find() result: ${nativeDocs.length} items`);
        
        if (nativeDocs.length !== docs.length) {
          console.error(`[seoAgentBacklog] ❌ КРИТИЧЕСКОЕ РАСХОЖДЕНИЕ: Mongoose find()=${docs.length}, Native find()=${nativeDocs.length}`);
        }
      } else {
        console.log(`[seoAgentBacklog] ✅ Количество совпадает: ${docs.length} = ${totalCount}`);
      }
      
      // Map items and count by status
      const mappedItems = docs.map(mapBacklogIdea);
      console.log(`[seoAgentBacklog] Mapped ${mappedItems.length} items after mapping`);
      
      const statusCounts = mappedItems.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`[seoAgentBacklog] Status breakdown after mapping:`, statusCounts);
      console.log(`[seoAgentBacklog] Items with PENDING status (will be shown): ${statusCounts.PENDING || 0}`);
      console.log(`[seoAgentBacklog] Items with other statuses (will be hidden): ${mappedItems.length - (statusCounts.PENDING || 0)}`);
      console.log(`[seoAgentBacklog] Returning ${mappedItems.length} items to GraphQL`);
      
      if (docs.length > 0) {
        console.log("[seoAgentBacklog] Sample items (first 3):", docs.slice(0, 3).map(d => ({
          id: d.id,
          title: d.title.substring(0, 50) + "...",
          originalStatus: d.status,
          mappedStatus: mapBacklogStatus(d.status)
        })));
      }
      
      // Check if there's a limit being applied somewhere
      if (mappedItems.length !== docs.length) {
        console.warn(`[seoAgentBacklog] ⚠️ WARNING: mappedItems.length (${mappedItems.length}) !== docs.length (${docs.length})`);
      }
      
      return mappedItems;
    },
    seoAgentContentIdeas: async (
      _: unknown,
      args: { projectId: string; hypothesisId?: string },
      context: any
    ) => {
      console.log("[seoAgentContentIdeas] 📥 Request:", {
        projectId: args.projectId,
        hypothesisId: args.hypothesisId || "NOT PROVIDED",
        contextUserId: context?.userId || "NOT PROVIDED"
      });
      
      if (!args.hypothesisId) {
        console.log("[seoAgentContentIdeas] ⚠️ No hypothesisId provided, returning empty array");
        return [];
      }

      // Check for existing content ideas (exclude archived/dismissed ones)
      // Include items with backlogIdeaId - they are generated from backlog and should appear in ideas list
      const query: Record<string, unknown> = { 
        projectId: args.projectId,
        hypothesisId: args.hypothesisId,
        status: { $ne: "archived" } // archived status means dismissed
      };
      const existingDocs = await SeoContentItem.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      
      // Log details about found items
      if (existingDocs.length > 0) {
        const withBacklogId = existingDocs.filter(d => d.backlogIdeaId);
        const withoutBacklogId = existingDocs.filter(d => !d.backlogIdeaId);
        const byStatus = existingDocs.reduce((acc, d) => {
          acc[d.status] = (acc[d.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const byCategory = existingDocs.reduce((acc, d) => {
          acc[d.category] = (acc[d.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        // Check for Russian vs English titles (simple heuristic)
        const russianTitles = existingDocs.filter(d => {
          const title = d.title || "";
          return /[а-яё]/i.test(title);
        });
        const englishTitles = existingDocs.filter(d => {
          const title = d.title || "";
          return !/[а-яё]/i.test(title);
        });
        console.log(`[seoAgentContentIdeas] Items breakdown: ${withBacklogId.length} with backlogIdeaId, ${withoutBacklogId.length} without`);
        console.log(`[seoAgentContentIdeas] By status:`, byStatus);
        console.log(`[seoAgentContentIdeas] By category:`, byCategory);
        console.log(`[seoAgentContentIdeas] Language breakdown: ${russianTitles.length} Russian titles, ${englishTitles.length} English titles`);
        if (russianTitles.length > 0) {
          console.log(`[seoAgentContentIdeas] Russian sample titles:`, russianTitles.slice(0, 3).map(d => d.title));
        }
        if (englishTitles.length > 0) {
          console.log(`[seoAgentContentIdeas] English sample titles:`, englishTitles.slice(0, 3).map(d => d.title));
        }
      }
      
      console.log(`[seoAgentContentIdeas] ✅ Found ${existingDocs.length} existing content items`);
      if (existingDocs.length > 0) {
        console.log(`[seoAgentContentIdeas] Sample titles:`, existingDocs.slice(0, 3).map(d => d.title));
        // Log FAQ items specifically
        const faqItems = existingDocs.filter(d => d.category === "faq");
        console.log(`[seoAgentContentIdeas] FAQ items: ${faqItems.length}`);
        if (faqItems.length > 0) {
          console.log(`[seoAgentContentIdeas] FAQ sample titles:`, faqItems.slice(0, 3).map(d => d.title));
        }
        // Log dates to see when items were created
        const dates = existingDocs.map(d => ({
          title: d.title?.substring(0, 50),
          createdAt: d.createdAt,
          updatedAt: d.updatedAt
        })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        console.log(`[seoAgentContentIdeas] Date range: ${dates[0]?.createdAt} to ${dates[dates.length - 1]?.createdAt}`);
        const nov16Items = existingDocs.filter(d => {
          const date = d.createdAt;
          return date.getFullYear() === 2025 && date.getMonth() === 10 && date.getDate() === 16;
        });
        console.log(`[seoAgentContentIdeas] Items from 16/11/2025: ${nov16Items.length}`);
        if (nov16Items.length > 0) {
          console.log(`[seoAgentContentIdeas] 16/11/2025 sample titles:`, nov16Items.slice(0, 5).map(d => d.title));
        }
      }

      // Return existing ideas only - generation should be done via mutation
      const mapped = existingDocs.map(mapContentIdea);
      console.log(`[seoAgentContentIdeas] 📤 Returning ${mapped.length} mapped content ideas`);
      return mapped;
      try {
        const { loadSeoContext } = await import("../services/context/seoContext.js");
        const { generateIdeasFromOpenAI } = await import("../services/contentIdeas/generator.js");
        
        const userId = context?.userId || "system";
        const seoContext = await loadSeoContext(args.projectId, args.hypothesisId, userId);

        // Get language from settings or context
        let language = seoContext.language;
        if (!language) {
          // Try to get from SeoSprintSettings
          const settings = await SeoSprintSettings.findOne({
            projectId: args.projectId,
            hypothesisId: args.hypothesisId
          }).exec();
          language = settings?.language || null;
        }
        // Fallback to Russian if still no language
        if (!language) {
          language = "Russian";
        }

        // Categories to generate ideas for
        const categories = [
          { name: "PAIN", count: 3 },
          { name: "GOAL", count: 3 },
          { name: "TRIGGER", count: 3 },
          { name: "FEATURE", count: 3 },
          { name: "BENEFIT", count: 3 },
          { name: "FAQ", count: 3 },
          { name: "INFO", count: 3 }
        ];

        const allGeneratedIdeas: any[] = [];

        // Generate ideas for each category
        for (const { name, count } of categories) {
          try {
            const generated = await generateIdeasFromOpenAI({
              context: seoContext,
              category: name,
              count,
              language: language
            });

            // Map generated ideas to SeoContentItem format
            for (const idea of generated) {
              // Determine format and category
              let format: "blog" | "commercial" | "faq" = "blog";
              let category: string = name.toLowerCase();
              
              if (name === "FEATURE" || name === "BENEFIT") {
                format = "commercial";
                category = name === "FEATURE" ? "feature" : "benefit";
              } else if (name === "FAQ") {
                format = "faq";
                category = "faq";
              } else {
                format = "blog";
                category = name.toLowerCase();
              }

              // Create SeoContentItem
              const contentItem = await SeoContentItem.create({
                projectId: args.projectId,
                hypothesisId: args.hypothesisId,
                title: idea.title,
                category: category as any,
                format: format,
                status: "draft",
                outline: idea.summary,
                createdBy: userId,
                updatedBy: userId
              });

              allGeneratedIdeas.push(contentItem);
            }
          } catch (error) {
            console.error(`Error generating ideas for category ${name}:`, error);
            // Continue with other categories
          }
        }

        console.log(`Generated ${allGeneratedIdeas.length} new content ideas`);
        return allGeneratedIdeas.map(mapContentIdea);
      } catch (error) {
        console.error("Error generating content ideas:", error);
        // Return empty array if generation fails
        return [];
      }
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
        const preferredDays = settings.publishDays.map((day: number) => dayNames[day] || `Day ${day}`);
        
        return {
          id: settings.id,
          projectId: settings.projectId,
          hypothesisId: settings.hypothesisId || null,
          weeklyPublishCount: settings.weeklyCadence,
          preferredDays,
          language: settings.language || null,
          autoPublishEnabled: false, // Not in SeoSprintSettings model yet
          wordpressBaseUrl: settings.wordpressBaseUrl || null,
          wordpressUsername: settings.wordpressUsername || null,
          wordpressConnected: !!(settings.wordpressBaseUrl && settings.wordpressUsername && settings.wordpressAppPassword),
          wordpressDefaultCategoryId: (settings as any).wordpressDefaultCategoryId || null,
          wordpressDefaultTagIds: (settings as any).wordpressDefaultTagIds || [],
          wordpressPostType: (settings as any).wordpressPostType || null,
          updatedAt: settings.updatedAt
        };
      }
      
      // Return default settings if not found
      return {
        id: `posting-settings-${args.projectId}`,
        projectId: args.projectId,
        language: null,
        hypothesisId: null,
        weeklyPublishCount: 2,
        preferredDays: ["Tuesday", "Thursday"],
        autoPublishEnabled: false,
        wordpressPostType: null,
        wordpressBaseUrl: null,
        wordpressUsername: null,
        wordpressConnected: false,
        wordpressDefaultCategoryId: null,
        wordpressDefaultTagIds: [],
        updatedAt: new Date()
      };
    },
    wordpressCategories: async (
      _: unknown,
      { input }: { input: { wordpressBaseUrl: string; wordpressUsername: string; wordpressAppPassword: string; postType?: string } }
    ) => {
      try {
        console.log("[wordpressCategories] Fetching categories from:", input.wordpressBaseUrl, "postType:", input.postType || "post");
        
        // Import WordPress client
        const { wordpressClient } = await import("../services/wordpress/apiClient.js");
        
        // Normalize input
        const baseUrl = input.wordpressBaseUrl.trim().replace(/\/$/, "");
        const username = input.wordpressUsername.trim();
        const appPassword = input.wordpressAppPassword.trim();
        const postType = input.postType?.trim() || "post";
        
        // Initialize client with provided credentials
        wordpressClient.initialize({
          baseUrl,
          username,
          appPassword
        });
        
        // Get categories for the specified post type
        const categories = await wordpressClient.getCategories(postType);
        console.log(`[wordpressCategories] Found ${categories.length} categories for post type ${postType}`);
        
        return categories;
      } catch (error: any) {
        console.error("[wordpressCategories] Error:", error);
        throw new Error(error.message || "Failed to fetch WordPress categories");
      }
    },
    wordpressTags: async (
      _: unknown,
      { input }: { input: { wordpressBaseUrl: string; wordpressUsername: string; wordpressAppPassword: string; postType?: string } }
    ) => {
      try {
        console.log("[wordpressTags] Fetching tags from:", input.wordpressBaseUrl, "postType:", input.postType || "post");
        
        // Import WordPress client
        const { wordpressClient } = await import("../services/wordpress/apiClient.js");
        
        // Normalize input
        const baseUrl = input.wordpressBaseUrl.trim().replace(/\/$/, "");
        const username = input.wordpressUsername.trim();
        const appPassword = input.wordpressAppPassword.trim();
        const postType = input.postType?.trim() || "post";
        
        // Initialize client with provided credentials
        wordpressClient.initialize({
          baseUrl,
          username,
          appPassword
        });
        
        // Get tags for the specified post type
        const tags = await wordpressClient.getTags(postType);
        console.log(`[wordpressTags] Found ${tags.length} tags for post type ${postType}`);
        
        return tags;
      } catch (error: any) {
        console.error("[wordpressTags] Error:", error);
        throw new Error(error.message || "Failed to fetch WordPress tags");
      }
    },
    wordpressPostTypes: async (
      _: unknown,
      { input }: { input: { wordpressBaseUrl: string; wordpressUsername: string; wordpressAppPassword: string } }
    ) => {
      try {
        console.log("[wordpressPostTypes] Fetching post types from:", input.wordpressBaseUrl);
        
        // Import WordPress client
        const { wordpressClient } = await import("../services/wordpress/apiClient.js");
        
        // Normalize input
        const baseUrl = input.wordpressBaseUrl.trim().replace(/\/$/, "");
        const username = input.wordpressUsername.trim();
        const appPassword = input.wordpressAppPassword.trim();
        
        // Initialize client with provided credentials
        wordpressClient.initialize({
          baseUrl,
          username,
          appPassword
        });
        
        // Get post types
        const postTypes = await wordpressClient.getPostTypes();
        console.log(`[wordpressPostTypes] Found ${postTypes.length} post types`);
        
        return postTypes;
      } catch (error: any) {
        console.error("[wordpressPostTypes] Error:", error);
        throw new Error(error.message || "Failed to fetch WordPress post types");
      }
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
      console.log("[updateSeoAgentPostingSettings] ===== UPDATE START =====");
      console.log("[updateSeoAgentPostingSettings] Input:", {
        projectId: input.projectId,
        hypothesisId: input.hypothesisId,
        weeklyPublishCount: input.weeklyPublishCount,
        preferredDays: input.preferredDays,
        preferredDaysType: typeof input.preferredDays?.[0],
        preferredDaysLength: input.preferredDays?.length,
        autoPublishEnabled: input.autoPublishEnabled
      });
      
      const userId = context?.userId || "system";
      
      try {
        // Validate preferredDays
        if (!Array.isArray(input.preferredDays)) {
          const error = new Error("preferredDays must be an array");
          console.error("[updateSeoAgentPostingSettings] ❌ Invalid preferredDays:", input.preferredDays);
          throw error;
        }
        
        // Map day names to numbers (0-6)
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        console.log("[updateSeoAgentPostingSettings] Mapping day names to numbers...");
        const publishDays = input.preferredDays.map((dayName: string) => {
          const index = dayNames.findIndex(day => day.toLowerCase() === dayName.toLowerCase());
          if (index < 0) {
            console.warn("[updateSeoAgentPostingSettings] ⚠️ Unknown day name:", dayName);
          }
          return index >= 0 ? index : 1; // Default to Monday if not found
        });
        console.log("[updateSeoAgentPostingSettings] ✅ Mapped days:", {
          input: input.preferredDays,
          output: publishDays
        });
      
      // Use existing SeoSprintSettings model
      const updateData: any = {
        projectId: input.projectId,
        hypothesisId: input.hypothesisId || "",
        weeklyCadence: input.weeklyPublishCount,
        publishDays,
        updatedBy: userId
      };
      
      // Add language if provided
      if (input.language !== undefined && input.language !== null) {
        updateData.language = input.language;
      }

      // Add WordPress connection settings if provided
      if (input.wordpressBaseUrl !== undefined) {
        updateData.wordpressBaseUrl = input.wordpressBaseUrl || null;
      }
      if (input.wordpressUsername !== undefined) {
        updateData.wordpressUsername = input.wordpressUsername || null;
      }
      if (input.wordpressAppPassword !== undefined) {
        updateData.wordpressAppPassword = input.wordpressAppPassword || null;
      }
      if (input.wordpressDefaultCategoryId !== undefined) {
        updateData.wordpressDefaultCategoryId = input.wordpressDefaultCategoryId || null;
      }
      if (input.wordpressDefaultTagIds !== undefined) {
        updateData.wordpressDefaultTagIds = Array.isArray(input.wordpressDefaultTagIds) ? input.wordpressDefaultTagIds : [];
      }
      if (input.wordpressPostType !== undefined) {
        updateData.wordpressPostType = input.wordpressPostType || null;
      }
      
      const settings = await SeoSprintSettings.findOneAndUpdate(
        { 
          projectId: input.projectId,
          hypothesisId: input.hypothesisId || ""
        },
        updateData,
        { 
          upsert: true, 
          new: true 
        }
      ).exec();
      
        if (!settings) {
          const error = new Error("Failed to update posting settings");
          console.error("[updateSeoAgentPostingSettings] ❌ Settings update failed");
          throw error;
        }
        
        // Map back to PostingSettings format
        const preferredDays = settings.publishDays.map((day: number) => dayNames[day] || `Day ${day}`);
        
        console.log("[updateSeoAgentPostingSettings] ✅ Settings updated successfully");
        console.log("[updateSeoAgentPostingSettings] WordPress Post Type:", (settings as any).wordpressPostType || "post (default)");
        console.log("[updateSeoAgentPostingSettings] ===== UPDATE SUCCESS =====");
        
        return {
          id: settings.id,
          projectId: settings.projectId,
          hypothesisId: settings.hypothesisId || null,
          weeklyPublishCount: settings.weeklyCadence,
          preferredDays,
          autoPublishEnabled: input.autoPublishEnabled || false, // Not stored in SeoSprintSettings yet
          language: settings.language || null,
          wordpressBaseUrl: settings.wordpressBaseUrl || null,
          wordpressUsername: settings.wordpressUsername || null,
          wordpressConnected: !!(settings.wordpressBaseUrl && settings.wordpressUsername && settings.wordpressAppPassword),
          wordpressDefaultCategoryId: (settings as any).wordpressDefaultCategoryId || null,
          wordpressDefaultTagIds: (settings as any).wordpressDefaultTagIds || [],
          wordpressPostType: (settings as any).wordpressPostType || null,
          updatedAt: settings.updatedAt
        };
      } catch (error: any) {
        console.error("[updateSeoAgentPostingSettings] ===== UPDATE FAILED =====");
        console.error("[updateSeoAgentPostingSettings] ❌ Error:", error);
        console.error("[updateSeoAgentPostingSettings] Error details:", {
          projectId: input.projectId,
          hypothesisId: input.hypothesisId,
          preferredDays: input.preferredDays,
          preferredDaysType: typeof input.preferredDays?.[0],
          errorMessage: error?.message,
          errorStack: error?.stack
        });
        throw error;
      }
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
      // Map GraphQL category enum to database format
      const categoryMap: Record<string, ContentCategory> = {
        PAINS: "pain",
        GOALS: "goal",
        TRIGGERS: "trigger",
        PRODUCT_FEATURES: "feature",
        BENEFITS: "benefit",
        FAQS: "faq",
        INFORMATIONAL: "info"
      };
      const dbCategory = categoryMap[category] || "info";

      const payload = {
        projectId,
        hypothesisId,
        backlogIdeaId,
        title,
        category: dbCategory as ContentCategory,
        format: (format === "COMMERCIAL_PAGE"
          ? "commercial"
          : format === "FAQ"
          ? "faq"
          : format === "BLOG"
          ? "blog"
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

      // Get backlog idea first to get project/hypothesis info
      const backlogIdea = await SeoBacklogIdea.findById(backlogIdeaId).exec();
      if (!backlogIdea) {
        console.error("[generateContentForBacklogIdea] Backlog idea not found:", backlogIdeaId);
        throw new Error("Backlog idea not found");
      }

      // Ensure hypothesisId is available
      const finalHypothesisId = hypothesisId || backlogIdea.hypothesisId;
      if (!finalHypothesisId) {
        console.error("[generateContentForBacklogIdea] hypothesisId is missing:", {
          providedHypothesisId: hypothesisId,
          backlogIdeaHypothesisId: backlogIdea.hypothesisId
        });
        throw new Error("hypothesisId is required for content generation");
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

      try {
        // Load SEO context first to get project and hypothesis titles for logging
        const { loadSeoContext } = await import("../services/context/seoContext.js");
        const userId = context?.userId || "system";
        const seoContext = await loadSeoContext(projectId, finalHypothesisId, userId);
        
        console.log("[generateContentForBacklogIdea] ===== CONTENT GENERATION START =====");
        console.log("[generateContentForBacklogIdea] Project:", seoContext.project?.title || "NOT FOUND", `(ID: ${projectId})`);
        console.log("[generateContentForBacklogIdea] Hypothesis:", seoContext.hypothesis?.title || "NOT FOUND", `(ID: ${finalHypothesisId})`);
        console.log("[generateContentForBacklogIdea] Backlog Idea:", backlogIdea.title, `(ID: ${backlogIdeaId})`);
        console.log("[generateContentForBacklogIdea] Category:", backlogIdea.category || "info");

        // Prepare context for content generation
        const projectContext = seoContext.project ? {
          title: seoContext.project.title,
          leanCanvas: seoContext.leanCanvas
        } : {};
        
        const hypothesisContext = seoContext.hypothesis ? {
          title: seoContext.hypothesis.title,
          description: seoContext.hypothesis.description
        } : {};

        // Generate content using new prompt system
        const generated = await generateContent({
          title: backlogIdea.title,
          description: backlogIdea.description || undefined,
          category: backlogIdea.category || "info",
          userId,
          contentType: "ARTICLE", // Default to ARTICLE, can be extended
          projectContext,
          hypothesisContext,
          clusterContext,
          // New: use new prompt system
          backlogIdeaId: backlogIdea.id,
          projectId,
          hypothesisId: finalHypothesisId
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
            hypothesisId: finalHypothesisId,
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

        console.log("[generateContentForBacklogIdea] Content item created/updated:", {
          id: doc.id,
          title: doc.title,
          status: doc.status,
          contentLength: doc.content?.length || 0
        });

        // Auto-generate image for the content (async, don't wait)
        // Use already loaded seoContext to avoid duplicate calls
        (async () => {
          try {
            const { generateImage } = await import("../services/contentGeneration.js");
            
            // Prepare context for image generation from already loaded seoContext
            const imageProjectContext = seoContext.project ? {
              title: seoContext.project.title,
              leanCanvas: seoContext.leanCanvas
            } : undefined;
            
            const imageHypothesisContext = seoContext.hypothesis ? {
              title: seoContext.hypothesis.title,
              description: seoContext.hypothesis.description
            } : undefined;
            
            const imageIcpContext = seoContext.icp ? {
              persona: seoContext.icp.persona,
              pains: seoContext.icp.pains,
              goals: seoContext.icp.goals,
              triggers: seoContext.icp.triggers
            } : undefined;
            
            const imageResult = await generateImage({
              title: doc.title,
              description: doc.outline || backlogIdea.description || undefined,
              content: doc.content,
              projectContext: imageProjectContext,
              hypothesisContext: imageHypothesisContext,
              icpContext: imageIcpContext
            });

            // Update content item with generated image
            await SeoContentItem.findByIdAndUpdate(
              doc.id,
              {
                imageUrl: imageResult.imageUrl,
                updatedBy: userId
              },
              { new: true }
            ).exec();

            console.log("[generateContentForBacklogIdea] Image generated and saved:", imageResult.imageUrl);
          } catch (imageError: any) {
            console.warn("[generateContentForBacklogIdea] Failed to auto-generate image:", imageError?.message || imageError);
            // Don't fail the whole operation if image generation fails
          }
        })();

        return mapContentItem(doc);
      } catch (error: any) {
        console.error("[generateContentForBacklogIdea] Error:", error);
        console.error("[generateContentForBacklogIdea] Details:", {
          backlogIdeaId,
          projectId,
          hypothesisId: finalHypothesisId,
          backlogIdeaTitle: backlogIdea.title,
          errorMessage: error?.message,
          errorStack: error?.stack
        });
        throw error;
      }
    },
    generateImageForContent: async (
      _: unknown,
      { input }: { input: any },
      context: any
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const { contentItemId, title, description } = input;
      const userId = context?.userId || "system";

      console.log("[generateImageForContent] Starting image generation:", {
        contentItemId,
        title,
        hasDescription: !!description
      });

      // Get content item
      const contentItem = await SeoContentItem.findById(contentItemId).exec();
      if (!contentItem) {
        console.error("[generateImageForContent] Content item not found:", contentItemId);
        throw new Error("Content item not found");
      }

      try {
        // Load context for better image generation
        const { loadSeoContext } = await import("../services/context/seoContext.js");
        let projectContext: any = undefined;
        let hypothesisContext: any = undefined;
        let icpContext: any = undefined;

        try {
          const seoContext = await loadSeoContext(
            contentItem.projectId,
            contentItem.hypothesisId,
            userId
          );
          
          if (seoContext.project) {
            projectContext = {
              title: seoContext.project.title,
              leanCanvas: seoContext.leanCanvas
            };
          }
          
          if (seoContext.hypothesis) {
            hypothesisContext = {
              title: seoContext.hypothesis.title,
              description: seoContext.hypothesis.description
            };
          }
          
          if (seoContext.icp) {
            icpContext = {
              persona: seoContext.icp.persona,
              pains: seoContext.icp.pains,
              goals: seoContext.icp.goals,
              triggers: seoContext.icp.triggers
            };
          }
          
          console.log("[generateImageForContent] Context loaded:", {
            hasProject: !!projectContext,
            hasHypothesis: !!hypothesisContext,
            hasICP: !!icpContext
          });
        } catch (contextError) {
          console.warn("[generateImageForContent] Failed to load context, continuing without it:", contextError);
          // Continue without context - image generation will still work
        }

        // Import generation service
        const { generateImage } = await import("../services/contentGeneration.js");

        // Generate image with context
        console.log("[generateImageForContent] Calling generateImage service...");
        const imageResult = await generateImage({
          title,
          description,
          content: (contentItem as any).content,
          projectContext,
          hypothesisContext,
          icpContext
        });

        console.log("[generateImageForContent] Image generated:", {
          hasImageUrl: !!imageResult.imageUrl,
          isPlaceholder: imageResult.imageUrl?.includes('placeholder') || imageResult.imageUrl?.includes('data:image/svg')
        });

        // Check if it's a placeholder - if so, throw error
        if (!imageResult.imageUrl || 
            imageResult.imageUrl.includes('data:image/svg+xml') || 
            imageResult.imageUrl.includes('placeholder')) {
          throw new Error("Image generation failed. Please check GEMINI_API_KEY or GOOGLE_API_KEY in backend environment variables.");
        }

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

        console.log("[generateImageForContent] Image saved successfully");
        return mapContentItem(updated);
      } catch (error: any) {
        console.error("[generateImageForContent] Error:", error);
        console.error("[generateImageForContent] Error details:", {
          message: error.message,
          stack: error.stack
        });
        // Re-throw with clear message
        throw new Error(error.message || "Failed to generate image. Check backend logs for details.");
      }
    },
    regenerateContent: async (
      _: unknown,
      { id, promptPart }: { id: string; promptPart?: string },
      context: any
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const userId = context?.userId || "system";

      console.log("[regenerateContent] ===== REGENERATION START =====");
      console.log("[regenerateContent] Input:", { id, promptPart, userId });

      try {
        // Get content item
        const contentItemId = id;
        const contentItem = await SeoContentItem.findById(contentItemId).exec();
        if (!contentItem) {
          const error = new Error("Content item not found");
          console.error("[regenerateContent] ❌ Content item not found:", id);
          console.error("[regenerateContent] Error details:", {
            id,
            userId,
            errorMessage: error.message
          });
          throw error;
        }

      console.log("[regenerateContent] Content item found:", {
        id: contentItem.id,
        title: contentItem.title,
        projectId: contentItem.projectId,
        hypothesisId: contentItem.hypothesisId,
        backlogIdeaId: contentItem.backlogIdeaId
      });

      // Get projectId and hypothesisId from content item
      const projectId = contentItem.projectId;
      const hypothesisId = contentItem.hypothesisId;
      const backlogIdeaId = contentItem.backlogIdeaId;

        if (!projectId || !hypothesisId) {
          const error = new Error("Content item missing projectId or hypothesisId");
          console.error("[regenerateContent] ❌ Missing required IDs:", {
            contentItemId: id,
            projectId,
            hypothesisId,
            backlogIdeaId
          });
          throw error;
        }

      // Import generation service
      const { generateContent } = await import("../services/contentGeneration.js");

        // Generate new content using new prompt system if backlogIdeaId is available
        const userIdForGeneration = context?.userId || "system";
        let generated;
        
        if (backlogIdeaId) {
          console.log("[regenerateContent] Using backlog idea for regeneration:", backlogIdeaId);
          
          // Use new prompt system with backlog idea
          // Load SEO context for better regeneration
          let seoContext;
          try {
            const { loadSeoContext } = await import("../services/context/seoContext.js");
            console.log("[regenerateContent] Loading SEO context...");
            seoContext = await loadSeoContext(projectId, hypothesisId, userIdForGeneration);
            console.log("[regenerateContent] ✅ SEO context loaded:", {
              hasProject: !!seoContext.project,
              hasHypothesis: !!seoContext.hypothesis,
              hasICP: !!seoContext.icp,
              language: seoContext.language
            });
          } catch (contextError: any) {
            console.error("[regenerateContent] ❌ Failed to load SEO context:", {
              error: contextError.message,
              stack: contextError.stack,
              projectId,
              hypothesisId
            });
            throw new Error(`Failed to load SEO context: ${contextError.message}`);
          }
          
          let backlogIdea;
          try {
            backlogIdea = await SeoBacklogIdea.findById(backlogIdeaId).exec();
            if (!backlogIdea) {
              const error = new Error(`Backlog idea not found: ${backlogIdeaId}`);
              console.error("[regenerateContent] ❌ Backlog idea not found:", backlogIdeaId);
              throw error;
            }
            console.log("[regenerateContent] ✅ Backlog idea found:", {
              id: backlogIdea.id,
              title: backlogIdea.title,
              category: backlogIdea.category
            });
          } catch (backlogError: any) {
            console.error("[regenerateContent] ❌ Error loading backlog idea:", {
              backlogIdeaId,
              error: backlogError.message,
              stack: backlogError.stack
            });
            throw backlogError;
          }

          // Build custom prompt if promptPart is provided
          let basePrompt: string;
          try {
            const { buildDraftPrompt } = await import("../services/contentDrafts/buildDraftPrompt.js");
            console.log("[regenerateContent] Building draft prompt...");
            const promptResult = buildDraftPrompt({
              context: seoContext,
              idea: backlogIdea,
              contentType: "article",
              language: seoContext.language,
              specialRequirements: promptPart || undefined
            });
            basePrompt = promptResult.prompt;
            console.log("[regenerateContent] ✅ Prompt built:", {
              length: basePrompt.length,
              detectedType: promptResult.detectedType
            });
          } catch (promptError: any) {
            console.error("[regenerateContent] ❌ Failed to build prompt:", {
              error: promptError.message,
              stack: promptError.stack
            });
            throw new Error(`Failed to build prompt: ${promptError.message}`);
          }

          // If promptPart is provided, append it to the prompt
          const finalPrompt = promptPart 
            ? `${basePrompt}\n\n### ADDITIONAL INSTRUCTIONS\n${promptPart}`
            : basePrompt;
          
          console.log("[regenerateContent] Final prompt length:", finalPrompt.length);

          // Use OpenAI directly with custom prompt
          const OpenAI = (await import("openai")).default;
          const { env } = await import("../config/env.js");
          const apiKey = process.env.OPENAI_API_KEY || env.openAiApiKey;
          if (!apiKey) {
            const error = new Error("OPENAI_API_KEY is not set in environment variables");
            console.error("[regenerateContent] ❌ OpenAI API key missing");
            throw error;
          }
          const client = new OpenAI({ apiKey });

          const model = env.openAiModel || "gpt-4o";
          console.log("[regenerateContent] Calling OpenAI API:", {
            model,
            promptLength: finalPrompt.length,
            hasApiKey: !!apiKey
          });
        
        let response;
        try {
          response = await client.chat.completions.create({
            model: model,
            temperature: 0.7,
            max_tokens: 8000,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content: "You are a senior content writer. Always respond with valid JSON matching the requested format."
              },
              {
                role: "user",
                content: finalPrompt
              }
            ]
          });
          } catch (apiError: any) {
            console.error("[regenerateContent] ❌ OpenAI API error:", {
              message: apiError.message,
              code: apiError.code,
              status: apiError.status,
              type: apiError.type,
              stack: apiError.stack
            });
            
            // Fallback to gpt-4o if model error
            if (model !== "gpt-4o") {
              console.log("[regenerateContent] ⚠️ Trying fallback model gpt-4o...");
              try {
                response = await client.chat.completions.create({
                  model: "gpt-4o",
                  temperature: 0.7,
                  max_tokens: 8000,
                  response_format: { type: "json_object" },
                  messages: [
                    {
                      role: "system",
                      content: "You are a senior content writer. Always respond with valid JSON matching the requested format."
                    },
                    {
                      role: "user",
                      content: finalPrompt
                    }
                  ]
                });
                console.log("[regenerateContent] ✅ Fallback model succeeded");
              } catch (fallbackError: any) {
                console.error("[regenerateContent] ❌ Fallback model also failed:", {
                  message: fallbackError.message,
                  code: fallbackError.code,
                  status: fallbackError.status
                });
                throw new Error(`OpenAI API failed: ${apiError.message}. Fallback also failed: ${fallbackError.message}`);
              }
            } else {
              throw new Error(`OpenAI API error: ${apiError.message}`);
            }
          }

        console.log("[regenerateContent] OpenAI API response received:", {
          hasChoices: !!response.choices,
          choicesCount: response.choices?.length || 0,
          firstChoiceHasContent: !!response.choices?.[0]?.message?.content,
          firstChoiceContentLength: response.choices?.[0]?.message?.content?.length || 0,
          finishReason: response.choices?.[0]?.finish_reason,
          model: response.model
        });

        const jsonContent = response.choices?.[0]?.message?.content || "";
        const finishReason = response.choices?.[0]?.finish_reason;
        
        if (!jsonContent) {
          console.error("[regenerateContent] ❌ No content in OpenAI response:", {
            finishReason,
            response: JSON.stringify(response, null, 2).substring(0, 1000)
          });
          
          if (finishReason === "length") {
            throw new Error("Failed to generate content: Response was truncated. Try reducing the prompt length or increasing max_tokens.");
          } else if (finishReason === "content_filter") {
            throw new Error("Failed to generate content: Response was filtered by content policy.");
          } else {
            throw new Error(`Failed to generate content: OpenAI API returned empty response (finish_reason: ${finishReason || "unknown"})`);
          }
        }
        
        console.log("[regenerateContent] ✅ Received JSON content, length:", jsonContent.length);

          // Parse JSON response and convert to HTML
          let parsed: any;
          try {
            const { convertJsonToMarkdown } = await import("../services/contentGeneration.js");
            console.log("[regenerateContent] Parsing JSON response...");
            parsed = JSON.parse(jsonContent);
            console.log("[regenerateContent] ✅ JSON parsed successfully");
            
            const htmlContent = convertJsonToMarkdown(parsed, contentItem.title);
            console.log("[regenerateContent] ✅ Content converted to HTML, length:", htmlContent.length);

            generated = {
              content: htmlContent,
              outline: parsed.summary || contentItem.outline || ""
            };
          } catch (parseError: any) {
            console.error("[regenerateContent] ❌ Failed to parse/convert content:", {
              error: parseError.message,
              stack: parseError.stack,
              jsonContentLength: jsonContent.length,
              jsonContentPreview: jsonContent.substring(0, 500)
            });
            throw new Error(`Failed to parse generated content: ${parseError.message}`);
          }
        } else {
          // Fallback to old system if no backlogIdeaId
          console.log("[regenerateContent] No backlogIdeaId, using old generation system");
          try {
            generated = await generateContent({
              title: contentItem.title,
              description: contentItem.outline || undefined,
              category: contentItem.category || "info",
              contentType: contentItem.format === "commercial" ? "COMMERCIAL_PAGE" : "ARTICLE",
              projectId,
              hypothesisId,
              userId: userIdForGeneration
            });
            console.log("[regenerateContent] ✅ Content generated via old system");
          } catch (genError: any) {
            console.error("[regenerateContent] ❌ Old generation system failed:", {
              error: genError.message,
              stack: genError.stack
            });
            throw genError;
          }
        }

        // Update content item with regenerated content
        console.log("[regenerateContent] Updating content item with new content...");
        let updated;
        try {
          updated = await SeoContentItem.findByIdAndUpdate(
            id,
            {
              content: generated.content,
              outline: generated.outline || contentItem.outline,
              updatedBy: userIdForGeneration
            },
            { new: true }
          ).exec();

          if (!updated) {
            const error = new Error("Failed to update content item");
            console.error("[regenerateContent] ❌ Failed to update content item:", {
              id,
              hasContent: !!generated.content,
              contentLength: generated.content?.length || 0
            });
            throw error;
          }

          console.log("[regenerateContent] ✅ Content item updated successfully");
          console.log("[regenerateContent] ===== REGENERATION SUCCESS =====");
          return mapContentItem(updated);
        } catch (updateError: any) {
          console.error("[regenerateContent] ❌ Failed to update content item:", {
            error: updateError.message,
            stack: updateError.stack,
            id,
            hasContent: !!generated?.content
          });
          throw updateError;
        }
      } catch (error: any) {
        console.error("[regenerateContent] ===== REGENERATION FAILED =====");
        console.error("[regenerateContent] ❌ Error:", error);
        console.error("[regenerateContent] Error details:", {
          id,
          promptPart,
          userId,
          errorMessage: error?.message,
          errorStack: error?.stack,
          errorName: error?.name,
          errorCode: error?.code
        });
        // Re-throw with clear message
        throw new Error(error.message || "Failed to regenerate content. Check backend logs for details.");
      }
    },
    rewriteTextSelection: async (
      _: unknown,
      { input }: { input: { contentItemId: string; selectedText: string; contextBefore?: string; contextAfter?: string; instruction?: string } },
      context: any
    ) => {
      const userId = context?.userId || "system";

      console.log("[rewriteTextSelection] Starting partial rewrite:", {
        contentItemId: input.contentItemId,
        selectedTextLength: input.selectedText.length,
        hasContextBefore: !!input.contextBefore,
        hasContextAfter: !!input.contextAfter,
        hasInstruction: !!input.instruction
      });

      try {
        // Get content item for context
        const contentItem = await SeoContentItem.findById(input.contentItemId).exec();
        if (!contentItem) {
          throw new Error("Content item not found");
        }

        // Build prompt for partial rewrite
        const prompt = `You are a professional content editor. Rewrite ONLY the selected text portion, keeping the same meaning but improving clarity, style, and engagement.

CONTEXT BEFORE:
${input.contextBefore || "(beginning of document)"}

SELECTED TEXT TO REWRITE:
${input.selectedText}

CONTEXT AFTER:
${input.contextAfter || "(end of document)"}

${input.instruction ? `SPECIFIC INSTRUCTION: ${input.instruction}` : "Improve the selected text while maintaining consistency with the surrounding context."}

IMPORTANT:
- Rewrite ONLY the selected text portion
- Keep the same HTML structure and formatting if present
- Maintain the same tone and style as the surrounding text
- Do not add content before or after the selected text
- Return ONLY the rewritten version of the selected text, nothing else`;

        // Use OpenAI to rewrite the selected portion
        const OpenAI = (await import("openai")).default;
        const { env } = await import("../config/env.js");
        const apiKey = process.env.OPENAI_API_KEY || env.openAiApiKey;
        
        if (!apiKey) {
          throw new Error("OPENAI_API_KEY is not set");
        }

        const client = new OpenAI({ apiKey });

        const model = env.openAiModel || "gpt-4o";
        let response;
        try {
          response = await client.chat.completions.create({
            model: model,
            temperature: 0.7,
            max_tokens: 2000,
            messages: [
              {
                role: "system",
                content: "You are a professional content editor. Rewrite only the selected text portion while maintaining consistency with the surrounding context. Return ONLY the rewritten text, no explanations."
              },
              {
                role: "user",
                content: prompt
              }
            ]
          });
        } catch (apiError: any) {
          console.error("[rewriteTextSelection] ❌ OpenAI API error:", {
            message: apiError.message,
            code: apiError.code,
            status: apiError.status
          });
          
          // Fallback to gpt-4o if model error
          if (model !== "gpt-4o") {
            console.log("[rewriteTextSelection] ⚠️ Trying fallback model gpt-4o...");
            response = await client.chat.completions.create({
              model: "gpt-4o",
              temperature: 0.7,
              max_tokens: 2000,
              messages: [
                {
                  role: "system",
                  content: "You are a professional content editor. Rewrite only the selected text portion while maintaining consistency with the surrounding context. Return ONLY the rewritten text, no explanations."
                },
                {
                  role: "user",
                  content: prompt
                }
              ]
            });
          } else {
            throw apiError;
          }
        }

        const rewrittenText = response.choices?.[0]?.message?.content?.trim() || "";
        
        if (!rewrittenText) {
          throw new Error("Failed to generate rewritten text");
        }

        console.log("[rewriteTextSelection] Successfully rewritten, length:", rewrittenText.length);

        return {
          rewrittenText,
          success: true,
          error: null
        };
      } catch (error: any) {
        console.error("[rewriteTextSelection] Error:", error);
        return {
          rewrittenText: "",
          success: false,
          error: error.message || "Failed to rewrite text selection"
        };
      }
    },
    approveContentItem: async (
      _: unknown,
      { input }: { input: { contentItemId: string; projectId: string; hypothesisId?: string } },
      context: any
    ): Promise<ReturnType<typeof mapContentItem>> => {
      const userId = context?.userId || "system";

      // Update status to "ready" (approved and ready for publishing)
      const updated = await SeoContentItem.findByIdAndUpdate(
        input.contentItemId,
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
    },
    publishToWordPress: async (
      _: unknown,
      { input }: { input: { contentItemId: string; projectId: string; hypothesisId?: string; status?: string } },
      context: any
    ) => {
      const userId = context?.userId || "system";

      try {
        // Get content item
        const contentItem = await SeoContentItem.findById(input.contentItemId).exec();
        if (!contentItem) {
          throw new Error("Content item not found");
        }

        // Import WordPress client and mapper
        const { wordpressClient } = await import("../services/wordpress/apiClient.js");
        const { mapContentItemToWordPressPost } = await import("../services/wordpress/mapper.js");
        type WordPressPost = import("../services/wordpress/apiClient.js").WordPressPost;

        // Get WordPress settings for this project to use default categories/tags
        const settings = await SeoSprintSettings.findOne({
          projectId: input.projectId,
          hypothesisId: input.hypothesisId || ""
        }).exec();

        // Prepare WordPress post using mapper
        const wpPost = await mapContentItemToWordPressPost(
          contentItem,
          settings,
          undefined // No scheduled date for manual publish
        );

        // Upload featured image if available
        console.log(`[publishToWordPress] Проверка изображения:`, {
          hasImageUrl: !!contentItem.imageUrl,
          imageUrlPreview: contentItem.imageUrl ? contentItem.imageUrl.substring(0, 50) + "..." : null,
          hasSettings: !!(settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword)
        });
        
        if (contentItem.imageUrl && settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword) {
          try {
            console.log(`[publishToWordPress] 🖼️  Начинаю загрузку изображения...`);
            const { uploadImageToWordPress } = await import("../services/wordpress/imageUpload.js");
            const mediaId = await uploadImageToWordPress(contentItem.imageUrl, {
              baseUrl: settings.wordpressBaseUrl.replace(/\/$/, ""),
              username: settings.wordpressUsername,
              appPassword: settings.wordpressAppPassword
            });
            if (mediaId) {
              wpPost.featured_media = mediaId;
              console.log(`[publishToWordPress] ✅ Featured image uploaded, media ID: ${mediaId}`);
            } else {
              console.warn(`[publishToWordPress] ⚠️ Не удалось загрузить изображение: ${contentItem.imageUrl?.substring(0, 100)}...`);
            }
          } catch (error: any) {
            console.error(`[publishToWordPress] ❌ Ошибка загрузки изображения:`, error.message);
            console.error(`[publishToWordPress] Stack:`, error.stack);
            // Continue without image if upload fails
          }
        } else {
          console.log(`[publishToWordPress] ⚠️ Изображение не будет загружено:`, {
            hasImageUrl: !!contentItem.imageUrl,
            hasSettings: !!(settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword)
          });
        }

        // Override status if provided
        if (input.status) {
          wpPost.status = input.status as WordPressPost["status"];
        }

        // Initialize WordPress client with settings
        if (settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword) {
          wordpressClient.initialize({
            baseUrl: settings.wordpressBaseUrl.replace(/\/$/, ""),
            username: settings.wordpressUsername,
            appPassword: settings.wordpressAppPassword
          });

        }

        // Publish to WordPress - WAIT for explicit confirmation
        console.log(`[publishToWordPress] ===== НАЧАЛО ПУБЛИКАЦИИ =====`);
        console.log(`[publishToWordPress] Content Item ID: ${input.contentItemId}`);
        console.log(`[publishToWordPress] Отправка контента в WordPress...`);
        
        const result = await wordpressClient.publishPost(wpPost);
        
        // CRITICAL: Only proceed if we got explicit confirmation from WordPress
        // Status "published" should ONLY be set after WordPress confirms publication
        if (!result || !result.id || !result.link) {
          console.error(`[publishToWordPress] ❌ WordPress не вернул подтверждение публикации!`);
          console.error(`[publishToWordPress] Ответ от WordPress:`, result);
          console.error(`[publishToWordPress] Статус НЕ будет изменен на "published"`);
          throw new Error("WordPress did not confirm publication. Missing post ID or link.");
        }
        
        console.log(`[publishToWordPress] ✅ WordPress подтвердил публикацию:`, {
          postId: result.id,
          link: result.link
        });
        console.log(`[publishToWordPress] Теперь можно обновить статус на "published"`);

        // CRITICAL: Status "published" should ONLY be set after WordPress confirms publication
        // This is the ONLY place in publishToWordPress where status should be set to "published"
        // We have explicit confirmation: result.id and result.link exist
        console.log(`[publishToWordPress] Обновление статуса content item на "published" (после подтверждения от WordPress)...`);
        const updatedContentItem = await SeoContentItem.findByIdAndUpdate(
          input.contentItemId,
          {
            status: "published" as SeoContentItemDoc["status"],
            updatedBy: userId
          },
          { new: true }
        ).exec();
        
        if (!updatedContentItem) {
          console.error(`[publishToWordPress] ❌ Не удалось обновить content item!`);
          throw new Error("Failed to update content item status");
        }
        
        // Verify status was actually updated
        if (updatedContentItem.status !== "published") {
          console.error(`[publishToWordPress] ❌ Статус не был обновлен на "published"! Текущий статус: ${updatedContentItem.status}`);
          throw new Error(`Failed to update content item status to published. Current status: ${updatedContentItem.status}`);
        }
        
        console.log(`[publishToWordPress] ✅ Content item статус обновлен на "published" (подтверждено WordPress)`);

        // Update backlog item status to IN_PROGRESS (published, but keep in sprint)
        // Don't use "published" or "archived" - keep as IN_PROGRESS so it stays visible in sprint
        // ONLY update after WordPress confirmed publication AND content item status is "published"
        if (updatedContentItem?.backlogIdeaId) {
          console.log(`[publishToWordPress] Обновление статуса backlog item на IN_PROGRESS...`);
          await SeoBacklogIdea.findByIdAndUpdate(
            updatedContentItem.backlogIdeaId,
            {
              status: "in_progress" // Keep in sprint after publishing
            }
          ).exec();
          console.log(`[publishToWordPress] ✅ Обновлен статус backlog item ${updatedContentItem.backlogIdeaId} на IN_PROGRESS (опубликован, остается в спринте)`);
        } else {
          console.warn(`[publishToWordPress] ⚠️ Content item не имеет backlogIdeaId, не обновляем backlog item`);
        }

        console.log(`[publishToWordPress] ===== ПУБЛИКАЦИЯ ЗАВЕРШЕНА УСПЕШНО =====`);
        console.log(`[publishToWordPress] Итоговые статусы:`, {
          contentItemStatus: updatedContentItem.status,
          backlogItemStatus: updatedContentItem.backlogIdeaId ? "in_progress" : "N/A",
          wordPressPostId: result.id,
          wordPressPostUrl: result.link
        });

        return {
          success: true,
          wordPressPostId: result.id,
          wordPressPostUrl: result.link,
          error: null
        };
      } catch (error: any) {
        console.error("[publishToWordPress] Error:", error);
        return {
          success: false,
          wordPressPostId: null,
          wordPressPostUrl: null,
          error: error.message || "Failed to publish to WordPress"
        };
      }
    },
    testWordPressConnection: async (
      _: unknown,
      { input }: { input: { wordpressBaseUrl: string; wordpressUsername: string; wordpressAppPassword: string; postType?: string } },
      context: any
    ) => {
      try {
        // Normalize and validate input
        const baseUrl = input.wordpressBaseUrl.trim().replace(/\/$/, "");
        const username = input.wordpressUsername.trim();
        const appPassword = input.wordpressAppPassword.trim();

        if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
          return {
            success: false,
            message: null,
            error: "WordPress URL must start with http:// or https://"
          };
        }

        console.log("[testWordPressConnection] Testing connection to:", baseUrl);

        // Import WordPress client
        const { wordpressClient } = await import("../services/wordpress/apiClient.js");

        // Initialize client with provided credentials
        wordpressClient.initialize({
          baseUrl,
          username,
          appPassword
        });

        // Test connection
        const result = await wordpressClient.testConnection();

        if (result.success) {
          console.log("[testWordPressConnection] Connection successful!");
          return {
            success: true,
            message: "Successfully connected to WordPress",
            error: null
          };
        } else {
          console.warn("[testWordPressConnection] Connection failed:", result.error);
          return {
            success: false,
            message: null,
            error: result.error || "Failed to connect to WordPress. Please check your credentials and URL."
          };
        }
      } catch (error: any) {
        console.error("[testWordPressConnection] Error:", error);
        return {
          success: false,
          message: null,
          error: error.message || "Failed to test WordPress connection"
        };
      }
    },
    generateContentIdeas: async (
      _: unknown,
      args: { projectId: string; hypothesisId: string; category?: string },
      context: any
    ) => {
      // Валидация входных параметров
      if (!args.projectId || !args.projectId.trim()) {
        throw new Error("projectId is required");
      }
      if (!args.hypothesisId || !args.hypothesisId.trim()) {
        throw new Error("hypothesisId is required");
      }
      
      console.log("[generateContentIdeas] Request:", { projectId: args.projectId, hypothesisId: args.hypothesisId, category: args.category || "ALL" });
      
      try {
        const { loadSeoContext } = await import("../services/context/seoContext.js");
        const { generateIdeasFromOpenAI, checkDuplicateIdea } = await import("../services/contentIdeas/generator.js");
        
        // Загружаем SEO контекст с проверкой принадлежности гипотезы к проекту
        const userId = context?.userId || "system";
        const seoContext = await loadSeoContext(args.projectId, args.hypothesisId, userId);
        console.log("[generateContentIdeas] Context:", seoContext.project?.title, "|", seoContext.hypothesis?.title);

        // Get language from settings or context
        let language = seoContext.language;
        if (!language) {
          const settings = await SeoSprintSettings.findOne({
            projectId: args.projectId,
            hypothesisId: args.hypothesisId
          }).exec();
          language = settings?.language || null;
        }
        if (!language) {
          language = "English"; // Default to English instead of Russian
        }
        
        console.log(`[generateContentIdeas] Using language: ${language}`);

        // Map category from ContentCategory enum to generator category names
        const categoryMap: Record<string, string> = {
          "PAINS": "PAIN",
          "GOALS": "GOAL",
          "TRIGGERS": "TRIGGER",
          "PRODUCT_FEATURES": "FEATURE",
          "BENEFITS": "BENEFIT",
          "FAQS": "FAQ",
          "INFORMATIONAL": "INFO"
        };

        // If specific category requested, generate only for that category
        let categories: Array<{ name: string; count: number }>;
        if (args.category && categoryMap[args.category]) {
          categories = [{ name: categoryMap[args.category], count: 3 }];
        } else {
          // Generate for all categories
          categories = [
            { name: "PAIN", count: 3 },
            { name: "GOAL", count: 3 },
            { name: "TRIGGER", count: 3 },
            { name: "FEATURE", count: 3 },
            { name: "BENEFIT", count: 3 },
            { name: "FAQ", count: 3 },
            { name: "INFO", count: 3 }
          ];
        }

        const allGeneratedIdeas: any[] = [];
        let duplicatesSkipped = 0;

        // Generate ideas for each category
        for (const { name, count } of categories) {
          try {
            console.log(`[generateContentIdeas] Generating ${count} ideas for category: ${name}`);
            const generated = await generateIdeasFromOpenAI({
              context: seoContext,
              category: name,
              count,
              language: language
            });
            console.log(`[generateContentIdeas] Generated ${generated.length} ideas for category: ${name}`);

            // Map generated ideas to SeoContentItem format and check for duplicates
            for (const idea of generated) {
              // Check for duplicates before saving
              const isDuplicate = await checkDuplicateIdea(
                args.projectId,
                args.hypothesisId,
                idea.title,
                idea.summary
              );
              
              if (isDuplicate) {
                console.log(`[generateContentIdeas] Skipping duplicate idea: "${idea.title}"`);
                duplicatesSkipped++;
                continue;
              }

              // Determine format and category
              let format: "blog" | "commercial" | "faq" = "blog";
              let category: string = name.toLowerCase();
              
              if (name === "FEATURE" || name === "BENEFIT") {
                format = "commercial";
                category = name === "FEATURE" ? "feature" : "benefit";
              } else if (name === "FAQ") {
                format = "faq";
                category = "faq";
              } else {
                format = "blog";
                category = name.toLowerCase();
              }

              // Create SeoContentItem
              try {
                console.log(`[generateContentIdeas] Saving idea: "${idea.title}"`);
                const contentItem = await SeoContentItem.create({
                  projectId: args.projectId,
                  hypothesisId: args.hypothesisId,
                  title: idea.title,
                  category: category as any,
                  format: format,
                  status: "draft",
                  outline: idea.summary,
                  createdBy: userId,
                  updatedBy: userId
                });

                console.log(`[generateContentIdeas] ✅ Saved idea: "${idea.title}" (ID: ${contentItem.id}, category: ${category})`);
                allGeneratedIdeas.push(contentItem);
              } catch (saveError: any) {
                console.error(`[generateContentIdeas] ❌ Failed to save idea "${idea.title}":`, saveError?.message || saveError);
                console.error(`[generateContentIdeas] Save error details:`, {
                  projectId: args.projectId,
                  hypothesisId: args.hypothesisId,
                  category: category,
                  format: format,
                  userId: userId
                });
                // Продолжаем, даже если одна идея не сохранилась
              }
            }
          } catch (error) {
            console.error(`[generateContentIdeas] Error generating ideas for category ${name}:`, error);
            if (error instanceof Error) {
              console.error(`[generateContentIdeas] Error message: ${error.message}`);
              console.error(`[generateContentIdeas] Error stack: ${error.stack}`);
            }
            // Continue with other categories - не прерываем генерацию для остальных категорий
          }
        }

        console.log(`Generated ${allGeneratedIdeas.length} new content ideas, skipped ${duplicatesSkipped} duplicates`);
        return allGeneratedIdeas.map(mapContentIdea);
      } catch (error) {
        console.error("Error generating content ideas:", error);
        throw error;
      }
    },
    logFrontendMessage: async (
      _: unknown,
      args: { level: string; message: string; data?: string },
      context: any
    ) => {
      const timestamp = new Date().toISOString();
      const prefix = `[FRONTEND ${args.level.toUpperCase()}]`;
      
      // Форматируем сообщение
      let logMessage = `${prefix} ${timestamp} ${args.message}`;
      if (args.data) {
        try {
          const parsed = JSON.parse(args.data);
          logMessage += `\n${JSON.stringify(parsed, null, 2)}`;
        } catch {
          logMessage += `\n${args.data}`;
        }
      }
      
      // Выводим в консоль бэкенда с соответствующим уровнем
      switch (args.level.toLowerCase()) {
        case 'error':
          console.error(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'info':
        case 'log':
        default:
          console.log(logMessage);
          break;
      }
      
      return true;
    }
  }
};

