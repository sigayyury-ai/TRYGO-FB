import authService from '../../services/AuthService';
import { IContext } from '../../types/IContext';
import { SeoCluster, type SeoClusterDoc, type SeoClusterIntent } from '../../db/models/SeoCluster';
import { SeoBacklogIdea, type SeoBacklogIdeaDoc } from '../../db/models/SeoBacklogIdea';
import { SeoSprintSettings, type SeoSprintSettingsDocument } from '../../db/models/SeoSprintSettings';
import { SeoContentItem, type SeoContentItemDoc } from '../../db/models/SeoContentItem';
import projectService from '../../services/ProjectService';

// Helper functions to convert database format to GraphQL format
const toUpperEnum = (value: string) => value.toUpperCase();
const toLowerEnum = (value: string) => value.toLowerCase();

const mapCluster = (doc: SeoClusterDoc) => ({
    id: doc._id.toString(),
    projectId: doc.projectId,
    hypothesisId: doc.hypothesisId,
    title: doc.title,
    intent: toUpperEnum(doc.intent) as any,
    keywords: doc.keywords,
    createdBy: doc.createdBy || null,
    updatedBy: doc.updatedBy || null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
});

const mapBacklogIdea = (doc: SeoBacklogIdeaDoc) => ({
    id: doc._id.toString(),
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
        published: "PUBLISHED"
    };
    return statusMap[status.toLowerCase()] || toUpperEnum(status);
};

const mapContentCategory = (category: string): string => {
    const categoryMap: Record<string, string> = {
        pain: "PAINS",
        goal: "GOALS",
        trigger: "TRIGGERS",
        feature: "PRODUCT_FEATURES",
        benefit: "BENEFITS",
        faq: "FAQS",
        info: "INFORMATIONAL"
    };
    return categoryMap[category.toLowerCase()] || toUpperEnum(category);
};

const mapContentType = (format: string): string => {
    const formatMap: Record<string, string> = {
        blog: "ARTICLE",
        commercial: "COMMERCIAL_PAGE",
        faq: "ARTICLE"
    };
    return formatMap[format.toLowerCase()] || "ARTICLE";
};

const mapContentIdea = (doc: SeoContentItemDoc) => {
    const isDismissed = false; // TODO: Add dismissed field to SeoContentItem model if needed
    return {
        id: doc._id.toString(),
        projectId: doc.projectId,
        hypothesisId: doc.hypothesisId,
        backlogIdeaId: doc.backlogIdeaId || null,
        title: doc.title,
        description: doc.outline || null, // Use outline as description
        category: mapContentCategory(doc.category) as any,
        contentType: mapContentType(doc.format) as any,
        clusterId: null, // TODO: Add clusterId field to SeoContentItem model if needed
        status: toUpperEnum(doc.status),
        dismissed: isDismissed, // Alias for isDismissed for frontend compatibility
        isDismissed: isDismissed,
        isAddedToBacklog: !!doc.backlogIdeaId,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
    };
};

const seoAgentQueryResolver = {
    Query: {
        async seoAgentClusters(
            _: never,
            args: { projectId: string; hypothesisId?: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                console.log(`[seoAgentClusters] projectId: ${args.projectId}, hypothesisId: ${args.hypothesisId}, userId: ${userId}`);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                const query: { projectId: string; hypothesisId?: string } = {
                    projectId: args.projectId,
                };

                if (args.hypothesisId) {
                    query.hypothesisId = args.hypothesisId;
                }

                console.log(`[seoAgentClusters] Query:`, JSON.stringify(query));
                
                // Use new integrated model
                const clusters = await SeoCluster.find(query)
                    .sort({ updatedAt: -1 })
                    .exec();
                console.log(`[seoAgentClusters] Found ${clusters.length} clusters`);

                // Always return an array, never null
                return clusters.map(mapCluster) || [];
            } catch (err) {
                console.error('Error in seoAgentClusters:', err);
                // Return empty array on error to satisfy GraphQL non-null requirement
                // Don't use elevateError here as it throws and prevents return
                return [];
            }
        },

        async seoAgentBacklog(
            _: never,
            args: { projectId: string; hypothesisId?: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                console.log(`[seoAgentBacklog] projectId: ${args.projectId}, hypothesisId: ${args.hypothesisId}, userId: ${userId}`);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                const query: { projectId: string; hypothesisId?: string } = {
                    projectId: args.projectId,
                };

                if (args.hypothesisId) {
                    query.hypothesisId = args.hypothesisId;
                }

                console.log(`[seoAgentBacklog] Query:`, JSON.stringify(query));
                
                // Use new integrated model
                const backlogItems = await SeoBacklogIdea.find(query)
                    .sort({ updatedAt: -1 })
                    .exec();
                console.log(`[seoAgentBacklog] Found ${backlogItems.length} items`);

                // Always return an array, never null or undefined
                return backlogItems.map(mapBacklogIdea) || [];
            } catch (err) {
                console.error('Error in seoAgentBacklog:', err);
                // Return empty array on error to satisfy GraphQL non-null requirement
                // Don't use elevateError here as it throws and prevents return
                return [];
            }
        },

        async seoAgentPostingSettings(
            _: never,
            args: { projectId: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                let settings = await SeoSprintSettings.findOne({
                    projectId: args.projectId,
                }).exec();

                // Return default settings if none exist
                if (!settings) {
                    return {
                        id: 'default',
                        projectId: args.projectId,
                        hypothesisId: null,
                        weeklyPublishCount: 2,
                        preferredDays: ['Tuesday', 'Thursday'],
                        autoPublishEnabled: false,
                        wordpressConnected: false,
                        updatedAt: new Date().toISOString(),
                    };
                }

                return {
                    id: settings._id.toString(),
                    projectId: settings.projectId,
                    hypothesisId: settings.hypothesisId || null,
                    weeklyPublishCount: settings.weeklyCadence,
                    preferredDays: settings.publishDays.map((d: number) => {
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return days[d] || 'Monday';
                    }),
                    autoPublishEnabled: false, // TODO: Add to model if needed
                    wordpressConnected: false, // Default to false, can be checked via testWordPressConnection mutation
                    updatedAt: settings.updatedAt?.toISOString() || new Date().toISOString(),
                };
            } catch (err) {
                console.error('Error in seoAgentPostingSettings:', err);
                // Return default settings on error
                return {
                    id: 'default',
                    projectId: args.projectId,
                    hypothesisId: null,
                    weeklyPublishCount: 2,
                    preferredDays: ['Tuesday', 'Thursday'],
                    autoPublishEnabled: false,
                    wordpressConnected: false,
                    updatedAt: new Date().toISOString(),
                };
            }
        },

        async seoAgentContentIdeas(
            _: never,
            args: { projectId: string; hypothesisId?: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                console.log(`[seoAgentContentIdeas] projectId: ${args.projectId}, hypothesisId: ${args.hypothesisId}, userId: ${userId}`);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                const query: { projectId: string; hypothesisId?: string } = {
                    projectId: args.projectId,
                };

                if (args.hypothesisId) {
                    query.hypothesisId = args.hypothesisId;
                }

                console.log(`[seoAgentContentIdeas] Query:`, JSON.stringify(query));
                
                // Query SeoContentItem for content ideas
                // Content ideas are typically items with status "draft" or items that haven't been fully developed
                const contentItems = await SeoContentItem.find(query)
                    .sort({ updatedAt: -1 })
                    .exec();
                console.log(`[seoAgentContentIdeas] Found ${contentItems.length} content items`);

                // Map to ContentIdea format
                // Always return an array, never null
                return contentItems.map(mapContentIdea) || [];
            } catch (err) {
                console.error('Error in seoAgentContentIdeas:', err);
                // Return empty array on error to satisfy GraphQL non-null requirement
                // Don't use elevateError here as it throws and prevents return
                return [];
            }
        },
    },
};

export default seoAgentQueryResolver;

