import authService from '../../services/AuthService';
import { IContext } from '../../types/IContext';
import { SeoAgentClusterModel, SeoAgentClusterIntent } from '../../models/SeoAgentClusterModel';
import { SeoAgentBacklogIdeaModel, SeoAgentBacklogContentType, SeoAgentBacklogStatus } from '../../models/SeoAgentBacklogIdeaModel';
import { SeoAgentPostingSettingsModel } from '../../models/SeoAgentPostingSettingsModel';
import projectService from '../../services/ProjectService';

// Helper functions to convert old format to new format
function mapOldIntentToNewIntent(intent: string): SeoAgentClusterIntent {
    // Map old intent to new intent (they should be the same, but ensure uppercase)
    // Old: commercial, transactional, informational, navigational (lowercase)
    // New: COMMERCIAL, TRANSACTIONAL, INFORMATIONAL, NAVIGATIONAL (uppercase)
    const intentUpper = intent?.toUpperCase();
    if (Object.values(SeoAgentClusterIntent).includes(intentUpper as SeoAgentClusterIntent)) {
        return intentUpper as SeoAgentClusterIntent;
    }
    return SeoAgentClusterIntent.INFORMATIONAL; // Default
}

function mapCategoryToContentType(category: string): SeoAgentBacklogContentType {
    // Map old category to new contentType
    // Old: pain, goal, trigger, feature, benefit, faq, info
    // New: ARTICLE, COMMERCIAL_PAGE, LANDING_PAGE
    if (['feature', 'benefit'].includes(category)) {
        return SeoAgentBacklogContentType.COMMERCIAL_PAGE;
    }
    if (['pain', 'goal'].includes(category)) {
        return SeoAgentBacklogContentType.LANDING_PAGE;
    }
    return SeoAgentBacklogContentType.ARTICLE; // Default for trigger, faq, info
}

function mapOldStatusToNewStatus(status: string): SeoAgentBacklogStatus {
    // Map old status to new status
    // Old: backlog, scheduled, archived
    // New: PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, ARCHIVED
    const statusMap: Record<string, SeoAgentBacklogStatus> = {
        'backlog': SeoAgentBacklogStatus.PENDING,
        'scheduled': SeoAgentBacklogStatus.SCHEDULED,
        'archived': SeoAgentBacklogStatus.ARCHIVED,
    };
    return statusMap[status] || SeoAgentBacklogStatus.PENDING;
}

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
                
                // Try new collection first
                let clusters = await SeoAgentClusterModel.find(query)
                    .sort({ updatedAt: -1 });
                console.log(`[seoAgentClusters] Found ${clusters.length} clusters in seoAgentClusters`);
                
                // If no items found, try old collection (seoclusters)
                if (clusters.length === 0) {
                    const mongoose = require('mongoose');
                    const oldCollection = mongoose.connection.db.collection('seoclusters');
                    const oldItems = await oldCollection.find(query).toArray();
                    console.log(`[seoAgentClusters] Found ${oldItems.length} clusters in old collection (seoclusters)`);
                    
                    // Convert old format to new format
                    clusters = oldItems.map((item: any) => ({
                        _id: item._id,
                        projectId: item.projectId,
                        hypothesisId: item.hypothesisId,
                        title: item.title,
                        intent: mapOldIntentToNewIntent(item.intent),
                        keywords: item.keywords || [],
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                    }));
                }
                
                console.log(`[seoAgentClusters] Total clusters after merge: ${clusters.length}`);

                // Always return an array, never null
                return clusters.map((cluster) => ({
                    id: cluster._id.toString(),
                    projectId: cluster.projectId,
                    hypothesisId: cluster.hypothesisId || null,
                    title: cluster.title,
                    intent: cluster.intent,
                    keywords: cluster.keywords,
                    createdAt: (cluster as any).createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: (cluster as any).updatedAt?.toISOString() || new Date().toISOString(),
                })) || [];
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
                
                // Try new collection first
                let backlogItems = await SeoAgentBacklogIdeaModel.find(query)
                    .sort({ updatedAt: -1 });
                console.log(`[seoAgentBacklog] Found ${backlogItems.length} items in seoAgentBacklogIdeas`);
                
                // If no items found, try old collection (seobacklogideas)
                if (backlogItems.length === 0) {
                    const mongoose = require('mongoose');
                    const oldCollection = mongoose.connection.db.collection('seobacklogideas');
                    const oldItems = await oldCollection.find(query).toArray();
                    console.log(`[seoAgentBacklog] Found ${oldItems.length} items in old collection (seobacklogideas)`);
                    
                    // Convert old format to new format
                    backlogItems = oldItems.map((item: any) => ({
                        _id: item._id,
                        projectId: item.projectId,
                        hypothesisId: item.hypothesisId,
                        title: item.title,
                        description: item.description,
                        contentType: mapCategoryToContentType(item.category),
                        clusterId: item.clusterId || null,
                        status: mapOldStatusToNewStatus(item.status),
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                    }));
                }
                
                console.log(`[seoAgentBacklog] Total items after merge: ${backlogItems.length}`);

                // Always return an array, never null or undefined
                return backlogItems.map((item) => ({
                    id: item._id.toString(),
                    projectId: item.projectId,
                    hypothesisId: item.hypothesisId || null,
                    title: item.title,
                    description: item.description || null,
                    contentType: item.contentType,
                    clusterId: item.clusterId || null,
                    status: item.status,
                    createdAt: (item as any).createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: (item as any).updatedAt?.toISOString() || new Date().toISOString(),
                })) || [];
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

                let settings = await SeoAgentPostingSettingsModel.findOne({
                    projectId: args.projectId,
                });

                // Return default settings if none exist
                if (!settings) {
                    return {
                        id: 'default',
                        projectId: args.projectId,
                        hypothesisId: null,
                        weeklyPublishCount: 2,
                        preferredDays: ['Tuesday', 'Thursday'],
                        autoPublishEnabled: false,
                        updatedAt: new Date().toISOString(),
                    };
                }

                return {
                    id: settings._id.toString(),
                    projectId: settings.projectId,
                    hypothesisId: settings.hypothesisId || null,
                    weeklyPublishCount: settings.weeklyPublishCount,
                    preferredDays: settings.preferredDays,
                    autoPublishEnabled: settings.autoPublishEnabled,
                    updatedAt: (settings as any).updatedAt?.toISOString() || new Date().toISOString(),
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
                    updatedAt: new Date().toISOString(),
                };
            }
        },
    },
};

export default seoAgentQueryResolver;

