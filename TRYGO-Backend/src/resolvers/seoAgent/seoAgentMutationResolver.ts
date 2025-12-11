import authService from '../../services/AuthService';
import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import { SeoCluster, type SeoClusterDoc, type SeoClusterIntent } from '../../db/models/SeoCluster';
import { SeoBacklogIdea, type SeoBacklogIdeaDoc } from '../../db/models/SeoBacklogIdea';
import { SeoSprintSettings, type SeoSprintSettingsDocument } from '../../db/models/SeoSprintSettings';
import projectService from '../../services/ProjectService';

const toUpperEnum = (value: string) => value.toUpperCase();
const toLowerEnum = (value: string) => value.toLowerCase();

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
                const validIntents: SeoClusterIntent[] = ["commercial", "transactional", "informational", "navigational"];
                const intentLower = args.input.intent.toLowerCase();
                if (!validIntents.includes(intentLower as SeoClusterIntent)) {
                    throw new Error(`Invalid intent: ${args.input.intent}`);
                }

                const cluster = new SeoCluster({
                    projectId: args.projectId,
                    hypothesisId: args.hypothesisId || undefined,
                    title: args.input.title,
                    intent: intentLower as SeoClusterIntent,
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
                    intent: toUpperEnum(savedCluster.intent),
                    keywords: savedCluster.keywords,
                    createdAt: savedCluster.createdAt.toISOString(),
                    updatedAt: savedCluster.updatedAt.toISOString(),
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
                const cluster = await SeoCluster.findById(args.id).exec();
                if (!cluster) {
                    throw new Error('Cluster not found');
                }

                await projectService.getProjectById(cluster.projectId, userId);

                // Validate intent
                const validIntents: SeoClusterIntent[] = ["commercial", "transactional", "informational", "navigational"];
                const intentLower = args.input.intent.toLowerCase();
                if (!validIntents.includes(intentLower as SeoClusterIntent)) {
                    throw new Error(`Invalid intent: ${args.input.intent}`);
                }

                cluster.title = args.input.title;
                cluster.intent = intentLower as SeoClusterIntent;
                cluster.keywords = args.input.keywords || [];
                cluster.updatedBy = userId;

                const updatedCluster = await cluster.save();

                return {
                    id: updatedCluster._id.toString(),
                    projectId: updatedCluster.projectId,
                    hypothesisId: updatedCluster.hypothesisId || null,
                    title: updatedCluster.title,
                    intent: toUpperEnum(updatedCluster.intent),
                    keywords: updatedCluster.keywords,
                    createdAt: updatedCluster.createdAt.toISOString(),
                    updatedAt: updatedCluster.updatedAt.toISOString(),
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
                const cluster = await SeoCluster.findById(args.id).exec();
                if (!cluster) {
                    throw new Error('Cluster not found');
                }

                await projectService.getProjectById(cluster.projectId, userId);

                await SeoCluster.findByIdAndDelete(args.id).exec();

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

                // Map preferredDays from day names to numbers
                const dayMap: Record<string, number> = {
                    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                    'Thursday': 4, 'Friday': 5, 'Saturday': 6
                };
                const publishDays = args.input.preferredDays.map((day: string) => dayMap[day] ?? 1);

                const settings = await SeoSprintSettings.findOneAndUpdate(
                    { projectId: args.projectId, hypothesisId: args.hypothesisId },
                    {
                        projectId: args.projectId,
                        hypothesisId: args.hypothesisId || undefined,
                        weeklyCadence: args.input.weeklyPublishCount,
                        publishDays: publishDays,
                        updatedBy: userId,
                    },
                    { upsert: true, new: true }
                ).exec();

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

                // Map GraphQL status to database status
                const statusLower = args.input.status.toLowerCase();
                const validStatuses = ["backlog", "scheduled", "archived", "pending", "in_progress", "completed", "published"];
                if (!validStatuses.includes(statusLower)) {
                    throw new Error(`Invalid status: ${args.input.status}`);
                }

                const backlogItem = new SeoBacklogIdea({
                    projectId: args.projectId,
                    hypothesisId: args.hypothesisId || undefined,
                    title: args.input.title,
                    description: args.input.description || undefined,
                    category: "info" as any, // Default category, can be extended
                    status: statusLower as any,
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
                    contentType: "ARTICLE" as const,
                    clusterId: savedItem.clusterId || null,
                    status: mapBacklogStatus(savedItem.status),
                    createdAt: savedItem.createdAt.toISOString(),
                    updatedAt: savedItem.updatedAt.toISOString(),
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
                const backlogItem = await SeoBacklogIdea.findById(args.id).exec();
                
                if (!backlogItem) {
                    throw new Error('Backlog item not found');
                }

                await projectService.getProjectById(backlogItem.projectId, userId);

                // Map GraphQL status to database status
                const statusLower = args.input.status.toLowerCase();
                const validStatuses = ["backlog", "scheduled", "archived", "pending", "in_progress", "completed", "published"];
                if (!validStatuses.includes(statusLower)) {
                    throw new Error(`Invalid status: ${args.input.status}`);
                }

                backlogItem.title = args.input.title || backlogItem.title;
                backlogItem.description = args.input.description !== undefined ? args.input.description : backlogItem.description;
                backlogItem.status = statusLower as any;
                backlogItem.clusterId = args.input.clusterId !== undefined ? args.input.clusterId : backlogItem.clusterId;
                backlogItem.updatedBy = userId;

                const updatedItem = await backlogItem.save();

                return {
                    id: updatedItem._id.toString(),
                    projectId: updatedItem.projectId,
                    hypothesisId: updatedItem.hypothesisId || null,
                    title: updatedItem.title,
                    description: updatedItem.description || null,
                    contentType: "ARTICLE" as const,
                    clusterId: updatedItem.clusterId || null,
                    status: mapBacklogStatus(updatedItem.status),
                    createdAt: updatedItem.createdAt.toISOString(),
                    updatedAt: updatedItem.updatedAt.toISOString(),
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
                const backlogItem = await SeoBacklogIdea.findById(args.id).exec();
                if (!backlogItem) {
                    throw new Error('Backlog item not found');
                }

                await projectService.getProjectById(backlogItem.projectId, userId);

                await SeoBacklogIdea.findByIdAndDelete(args.id).exec();

                return true;
            } catch (err) {
                elevateError(err);
            }
        },
    },
};

export default seoAgentMutationResolver;

