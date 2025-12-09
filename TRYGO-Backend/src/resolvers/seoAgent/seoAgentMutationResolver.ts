import authService from '../../services/AuthService';
import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import { SeoAgentClusterModel } from '../../models/SeoAgentClusterModel';
import { SeoAgentPostingSettingsModel } from '../../models/SeoAgentPostingSettingsModel';
import { SeoAgentBacklogIdeaModel, SeoAgentBacklogContentType, SeoAgentBacklogStatus } from '../../models/SeoAgentBacklogIdeaModel';
import projectService from '../../services/ProjectService';
import { SeoAgentClusterIntent } from '../../models/SeoAgentClusterModel';

// Helper functions to convert old format to new format
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

const seoAgentMutationResolver = {
    Mutation: {
        async createSeoAgentCluster(
            _: never,
            args: {
                projectId: string;
                hypothesisId?: string;
                input: {
                    title: string;
                    intent: string;
                    keywords: string[];
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                // Validate intent
                if (!Object.values(SeoAgentClusterIntent).includes(args.input.intent as SeoAgentClusterIntent)) {
                    throw new Error(`Invalid intent: ${args.input.intent}`);
                }

                const cluster = new SeoAgentClusterModel({
                    projectId: args.projectId,
                    hypothesisId: args.hypothesisId,
                    title: args.input.title,
                    intent: args.input.intent as SeoAgentClusterIntent,
                    keywords: args.input.keywords || [],
                    createdBy: userId,
                    updatedBy: userId,
                });

                const savedCluster = await cluster.save();

                return {
                    id: savedCluster._id.toString(),
                    projectId: savedCluster.projectId,
                    hypothesisId: savedCluster.hypothesisId || null,
                    title: savedCluster.title,
                    intent: savedCluster.intent,
                    keywords: savedCluster.keywords,
                    createdAt: (savedCluster as any).createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: (savedCluster as any).updatedAt?.toISOString() || new Date().toISOString(),
                };
            } catch (err) {
                elevateError(err);
            }
        },

        async updateSeoAgentCluster(
            _: never,
            args: {
                id: string;
                input: {
                    title: string;
                    intent: string;
                    keywords: string[];
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find cluster and verify user has access to its project
                const cluster = await SeoAgentClusterModel.findById(args.id);
                if (!cluster) {
                    throw new Error('Cluster not found');
                }

                await projectService.getProjectById(cluster.projectId, userId);

                // Validate intent
                if (!Object.values(SeoAgentClusterIntent).includes(args.input.intent as SeoAgentClusterIntent)) {
                    throw new Error(`Invalid intent: ${args.input.intent}`);
                }

                cluster.title = args.input.title;
                cluster.intent = args.input.intent as SeoAgentClusterIntent;
                cluster.keywords = args.input.keywords || [];
                cluster.updatedBy = userId;

                const updatedCluster = await cluster.save();

                return {
                    id: updatedCluster._id.toString(),
                    projectId: updatedCluster.projectId,
                    hypothesisId: updatedCluster.hypothesisId || null,
                    title: updatedCluster.title,
                    intent: updatedCluster.intent,
                    keywords: updatedCluster.keywords,
                    createdAt: (updatedCluster as any).createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: (updatedCluster as any).updatedAt?.toISOString() || new Date().toISOString(),
                };
            } catch (err) {
                elevateError(err);
            }
        },

        async deleteSeoAgentCluster(
            _: never,
            args: { id: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find cluster and verify user has access to its project
                const cluster = await SeoAgentClusterModel.findById(args.id);
                if (!cluster) {
                    throw new Error('Cluster not found');
                }

                await projectService.getProjectById(cluster.projectId, userId);

                await SeoAgentClusterModel.findByIdAndDelete(args.id);

                return true;
            } catch (err) {
                elevateError(err);
            }
        },

        async updateSeoAgentPostingSettings(
            _: never,
            args: {
                projectId: string;
                hypothesisId?: string;
                input: {
                    weeklyPublishCount: number;
                    preferredDays: string[];
                    autoPublishEnabled: boolean;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                // Validate weeklyPublishCount
                if (args.input.weeklyPublishCount < 1 || args.input.weeklyPublishCount > 7) {
                    throw new Error('weeklyPublishCount must be between 1 and 7');
                }

                const settings = await SeoAgentPostingSettingsModel.findOneAndUpdate(
                    { projectId: args.projectId },
                    {
                        projectId: args.projectId,
                        hypothesisId: args.hypothesisId,
                        weeklyPublishCount: args.input.weeklyPublishCount,
                        preferredDays: args.input.preferredDays,
                        autoPublishEnabled: args.input.autoPublishEnabled,
                        updatedBy: userId,
                    },
                    { upsert: true, new: true }
                );

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
                elevateError(err);
            }
        },

        async createSeoAgentBacklogIdea(
            _: never,
            args: {
                projectId: string;
                hypothesisId?: string;
                input: {
                    title: string;
                    description?: string;
                    contentType: string;
                    status: string;
                    clusterId?: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                // Validate contentType
                if (!Object.values(SeoAgentBacklogContentType).includes(args.input.contentType as SeoAgentBacklogContentType)) {
                    throw new Error(`Invalid contentType: ${args.input.contentType}`);
                }

                // Validate status
                if (!Object.values(SeoAgentBacklogStatus).includes(args.input.status as SeoAgentBacklogStatus)) {
                    throw new Error(`Invalid status: ${args.input.status}`);
                }

                const backlogItem = new SeoAgentBacklogIdeaModel({
                    projectId: args.projectId,
                    hypothesisId: args.hypothesisId,
                    title: args.input.title,
                    description: args.input.description || undefined,
                    contentType: args.input.contentType as SeoAgentBacklogContentType,
                    status: args.input.status as SeoAgentBacklogStatus,
                    clusterId: args.input.clusterId || undefined,
                    createdBy: userId,
                    updatedBy: userId,
                });

                const savedItem = await backlogItem.save();

                return {
                    id: savedItem._id.toString(),
                    projectId: savedItem.projectId,
                    hypothesisId: savedItem.hypothesisId || null,
                    title: savedItem.title,
                    description: savedItem.description || null,
                    contentType: savedItem.contentType,
                    clusterId: savedItem.clusterId || null,
                    status: savedItem.status,
                    createdAt: (savedItem as any).createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: (savedItem as any).updatedAt?.toISOString() || new Date().toISOString(),
                };
            } catch (err) {
                elevateError(err);
            }
        },

        async updateSeoAgentBacklogIdea(
            _: never,
            args: {
                id: string;
                input: {
                    title: string;
                    description?: string;
                    contentType: string;
                    status: string;
                    clusterId?: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find backlog item and verify user has access to its project
                let backlogItem = await SeoAgentBacklogIdeaModel.findById(args.id);
                
                // If not found in new collection, try old collection
                if (!backlogItem) {
                    const mongoose = require('mongoose');
                    const oldCollection = mongoose.connection.db.collection('seobacklogideas');
                    const oldItem = await oldCollection.findOne({ _id: new mongoose.Types.ObjectId(args.id) });
                    
                    if (oldItem) {
                        // Migrate old item to new collection
                        backlogItem = new SeoAgentBacklogIdeaModel({
                            projectId: oldItem.projectId,
                            hypothesisId: oldItem.hypothesisId,
                            title: oldItem.title,
                            description: oldItem.description,
                            contentType: mapCategoryToContentType(oldItem.category),
                            status: mapOldStatusToNewStatus(oldItem.status),
                            clusterId: oldItem.clusterId || undefined,
                            createdBy: userId,
                            updatedBy: userId,
                        });
                        await backlogItem.save();
                    }
                }
                
                if (!backlogItem) {
                    throw new Error('Backlog item not found');
                }

                await projectService.getProjectById(backlogItem.projectId, userId);

                // Validate contentType
                if (!Object.values(SeoAgentBacklogContentType).includes(args.input.contentType as SeoAgentBacklogContentType)) {
                    throw new Error(`Invalid contentType: ${args.input.contentType}`);
                }

                // Validate status
                if (!Object.values(SeoAgentBacklogStatus).includes(args.input.status as SeoAgentBacklogStatus)) {
                    throw new Error(`Invalid status: ${args.input.status}`);
                }

                backlogItem.title = args.input.title;
                backlogItem.description = args.input.description || undefined;
                backlogItem.contentType = args.input.contentType as SeoAgentBacklogContentType;
                backlogItem.status = args.input.status as SeoAgentBacklogStatus;
                backlogItem.clusterId = args.input.clusterId || undefined;
                backlogItem.updatedBy = userId;

                const updatedItem = await backlogItem.save();

                return {
                    id: updatedItem._id.toString(),
                    projectId: updatedItem.projectId,
                    hypothesisId: updatedItem.hypothesisId || null,
                    title: updatedItem.title,
                    description: updatedItem.description || null,
                    contentType: updatedItem.contentType,
                    clusterId: updatedItem.clusterId || null,
                    status: updatedItem.status,
                    createdAt: (updatedItem as any).createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: (updatedItem as any).updatedAt?.toISOString() || new Date().toISOString(),
                };
            } catch (err) {
                elevateError(err);
            }
        },

        async deleteSeoAgentBacklogIdea(
            _: never,
            args: { id: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find backlog item and verify user has access to its project
                const backlogItem = await SeoAgentBacklogIdeaModel.findById(args.id);
                if (!backlogItem) {
                    throw new Error('Backlog item not found');
                }

                await projectService.getProjectById(backlogItem.projectId, userId);

                await SeoAgentBacklogIdeaModel.findByIdAndDelete(args.id);

                return true;
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default seoAgentMutationResolver;

