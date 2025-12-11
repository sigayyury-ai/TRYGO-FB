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
      console.log("Updating seoAgentPostingSettings for projectId:", input.projectId);
      
      const userId = context?.userId || "system";
      
      // Map day names to numbers (0-6)
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const publishDays = input.preferredDays.map((dayName: string) => {
        const index = dayNames.findIndex(day => day.toLowerCase() === dayName.toLowerCase());
        return index >= 0 ? index : 1; // Default to Monday if not found
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
        throw new Error("Failed to update posting settings");
      }
      
      // Map back to PostingSettings format
      const preferredDays = settings.publishDays.map((day: number) => dayNames[day] || `Day ${day}`);
      
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

        // Generate content using new prompt system
        const generated = await generateContent({
          title: backlogIdea.title,
          description: backlogIdea.description || undefined,
          category: backlogIdea.category || "info",
          userId,
          contentType: "ARTICLE", // Default to ARTICLE, can be extended
          projectContext: {}, // Fallback for old system
          hypothesisContext: {}, // Fallback for old system
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
        (async () => {
          try {
            const { generateImage } = await import("../services/contentGeneration.js");
            const imageResult = await generateImage({
              title: doc.title,
              description: doc.outline || backlogIdea.description || undefined,
              content: doc.content
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

      console.log("[regenerateContent] Starting regeneration:", { id, promptPart, userId });

      // Get content item
      const contentItemId = id;
      const contentItem = await SeoContentItem.findById(contentItemId).exec();
      if (!contentItem) {
        console.error("[regenerateContent] Content item not found:", id);
        throw new Error("Content item not found");
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
        throw new Error("Content item missing projectId or hypothesisId");
      }

      // Import generation service
      const { generateContent } = await import("../services/contentGeneration.js");

      // Generate new content using new prompt system if backlogIdeaId is available
      const userIdForGeneration = context?.userId || "system";
      let generated;
      
      if (backlogIdeaId) {
        // Use new prompt system with backlog idea
        // Load SEO context for better regeneration
        const { loadSeoContext } = await import("../services/context/seoContext.js");
        const seoContext = await loadSeoContext(projectId, hypothesisId, userIdForGeneration);
        
        const backlogIdea = await SeoBacklogIdea.findById(backlogIdeaId).exec();
        if (!backlogIdea) {
          throw new Error(`Backlog idea not found: ${backlogIdeaId}`);
        }

        // Build custom prompt if promptPart is provided
        const { buildDraftPrompt } = await import("../services/contentDrafts/buildDraftPrompt.js");
        const { prompt: basePrompt } = buildDraftPrompt({
          context: seoContext,
          idea: backlogIdea,
          contentType: "article",
          language: seoContext.language,
          specialRequirements: promptPart || undefined
        });

        // If promptPart is provided, append it to the prompt
        const finalPrompt = promptPart 
          ? `${basePrompt}\n\n### ADDITIONAL INSTRUCTIONS\n${promptPart}`
          : basePrompt;

        // Use OpenAI directly with custom prompt
        const OpenAI = (await import("openai")).default;
        const { env } = await import("../config/env.js");
        const apiKey = process.env.OPENAI_API_KEY || env.openAiApiKey;
        if (!apiKey) {
          throw new Error("OPENAI_API_KEY is not set in environment variables");
        }
        const client = new OpenAI({ apiKey });

        const response = await client.chat.completions.create({
          model: env.openAiModel || "gpt-5.1",
          temperature: 0.7,
          max_completion_tokens: 8000, // gpt-5.1 uses max_completion_tokens instead of max_tokens
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

        const jsonContent = response.choices?.[0]?.message?.content || "";
        if (!jsonContent) {
          throw new Error("Failed to generate content");
        }

        // Parse JSON response and convert to HTML
        const { convertJsonToMarkdown } = await import("../services/contentGeneration.js");
        let parsed;
        try {
          parsed = JSON.parse(jsonContent);
        } catch (parseError: any) {
          console.error("[regenerateContent] Failed to parse JSON:", parseError);
          throw new Error(`Failed to parse generated content: ${parseError.message}`);
        }
        
        const htmlContent = convertJsonToMarkdown(parsed, contentItem.title);
        console.log("[regenerateContent] Content generated successfully, length:", htmlContent.length);

        generated = {
          content: htmlContent,
          outline: parsed.summary || contentItem.outline || ""
        };
      } else {
        // Fallback to old system if no backlogIdeaId
        generated = await generateContent({
          title: contentItem.title,
          description: contentItem.outline || undefined,
          category: contentItem.category || "info",
          contentType: contentItem.format === "commercial" ? "COMMERCIAL_PAGE" : "ARTICLE",
          projectId,
          hypothesisId,
          userId: userIdForGeneration
        });
      }

      // Update content item with regenerated content
      console.log("[regenerateContent] Updating content item with new content");
      const updated = await SeoContentItem.findByIdAndUpdate(
        id,
        {
          content: generated.content,
          outline: generated.outline || contentItem.outline,
          updatedBy: userIdForGeneration
        },
        { new: true }
      ).exec();

      if (!updated) {
        console.error("[regenerateContent] Failed to update content item");
        throw new Error("Failed to update content item");
      }

      console.log("[regenerateContent] Content item updated successfully");
      return mapContentItem(updated);
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

        const response = await client.chat.completions.create({
          model: env.openAiModel || "gpt-5.1",
          temperature: 0.7,
          max_completion_tokens: 2000, // gpt-5.1 uses max_completion_tokens instead of max_tokens
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
        const wpPost = mapContentItemToWordPressPost(
          contentItem,
          settings,
          undefined // No scheduled date for manual publish
        );

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

        // Publish to WordPress
        const result = await wordpressClient.publishPost(wpPost);

        // Update content item status to PUBLISHED
        const updatedContentItem = await SeoContentItem.findByIdAndUpdate(
          input.contentItemId,
          {
            status: "published" as SeoContentItemDoc["status"],
            updatedBy: userId
          },
          { new: true }
        ).exec();

        // Update backlog item status to PUBLISHED if it exists
        if (updatedContentItem?.backlogIdeaId) {
          await SeoBacklogIdea.findByIdAndUpdate(
            updatedContentItem.backlogIdeaId,
            {
              status: "published"
            }
          ).exec();
          console.log(`[publishToWordPress] Updated backlog item ${updatedContentItem.backlogIdeaId} to published status`);
        }

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
      { input }: { input: { wordpressBaseUrl: string; wordpressUsername: string; wordpressAppPassword: string } },
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

