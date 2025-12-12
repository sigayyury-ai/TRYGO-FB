import authService from '../../services/AuthService';
import { elevateError } from '../../errors/elevateError';
import { IContext } from '../../types/IContext';
import { SeoCluster, type SeoClusterDoc, type SeoClusterIntent } from '../../db/models/SeoCluster';
import { SeoBacklogIdea, type SeoBacklogIdeaDoc } from '../../db/models/SeoBacklogIdea';
import { SeoSprintSettings, type SeoSprintSettingsDocument } from '../../db/models/SeoSprintSettings';
import { SeoContentItem, type SeoContentItemDoc } from '../../db/models/SeoContentItem';
import projectService from '../../services/ProjectService';
import { generateContent } from '../../services/seoAgent/contentGeneration';
import { generateImageForContent } from '../../services/images/generateImage';
import { generateIdeasFromOpenAI } from '../../services/seoAgent/contentIdeas/generator';
import { loadSeoContext } from '../../services/seoAgent/context/seoContext';
import { wordpressClient } from '../../services/seoAgent/wordpress/apiClient';

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

// Reverse mapping: GraphQL enum -> MongoDB enum
const mapContentCategoryToDb = (category: string): string => {
    const categoryMap: Record<string, string> = {
        "PAINS": "pain",
        "GOALS": "goal",
        "TRIGGERS": "trigger",
        "PRODUCT_FEATURES": "feature",
        "BENEFITS": "benefit",
        "FAQS": "faq",
        "INFORMATIONAL": "info"
    };
    const upperCategory = category.toUpperCase();
    return categoryMap[upperCategory] || category.toLowerCase();
};

const mapContentType = (format: string): string => {
    const formatMap: Record<string, string> = {
        blog: "ARTICLE",
        commercial: "COMMERCIAL_PAGE",
        faq: "ARTICLE"
    };
    return formatMap[format.toLowerCase()] || "ARTICLE";
};

const mapContentItem = (doc: SeoContentItemDoc) => {
    return {
        id: doc._id.toString(),
        projectId: doc.projectId,
        hypothesisId: doc.hypothesisId,
        backlogIdeaId: doc.backlogIdeaId || null,
        title: doc.title,
        category: mapContentCategory(doc.category) as any,
        format: mapContentType(doc.format) as any,
        ownerId: doc.ownerId || null,
        reviewerId: doc.reviewerId || null,
        channel: doc.channel || null,
        outline: doc.outline || null,
        content: doc.content || null,
        imageUrl: doc.imageUrl || null,
        status: toUpperEnum(doc.status) as any,
        dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
        createdBy: doc.createdBy || null,
        updatedBy: doc.updatedBy || null,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString()
    };
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

const seoAgentMutationResolver = {
    Mutation: {
        async createSeoAgentCluster(
            _: never,
            args: {
                input: {
                    projectId: string;
                    hypothesisId: string;
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
                await projectService.getProjectById(args.input.projectId, userId);

                // Validate intent
                const validIntents: SeoClusterIntent[] = ["commercial", "transactional", "informational", "navigational"];
                const intentLower = args.input.intent.toLowerCase();
                if (!validIntents.includes(intentLower as SeoClusterIntent)) {
                    throw new Error(`Invalid intent: ${args.input.intent}`);
                }

                const cluster = new SeoCluster({
                    projectId: args.input.projectId,
                    hypothesisId: args.input.hypothesisId || undefined,
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
                    title?: string;
                    description?: string;
                    status?: string;
                    scheduledDate?: string | null;
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

                // Update fields if provided
                if (args.input.title !== undefined) {
                    backlogItem.title = args.input.title;
                }
                if (args.input.description !== undefined) {
                    backlogItem.description = args.input.description;
                }
                
                // Map GraphQL status to database status
                if (args.input.status !== undefined) {
                    const statusLower = args.input.status.toLowerCase();
                    const validStatuses = ["backlog", "scheduled", "archived", "pending", "in_progress", "completed", "published"];
                    if (!validStatuses.includes(statusLower)) {
                        throw new Error(`Invalid status: ${args.input.status}`);
                    }
                    backlogItem.status = statusLower as any;
                }
                
                // CRITICAL: Handle scheduledDate - this is the date the user selected
                if (args.input.scheduledDate !== undefined) {
                    // Set to Date or undefined (Mongoose will handle null/undefined the same way)
                    backlogItem.scheduledDate = args.input.scheduledDate ? new Date(args.input.scheduledDate) : undefined;
                }
                
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
                    scheduledDate: updatedItem.scheduledDate ? updatedItem.scheduledDate.toISOString() : null,
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

        async generateContentForBacklogIdea(
            _: never,
            args: {
                input: {
                    backlogIdeaId: string;
                    projectId: string;
                    hypothesisId: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.input.projectId, userId);

                // Find backlog idea
                const backlogIdea = await SeoBacklogIdea.findById(args.input.backlogIdeaId).exec();
                if (!backlogIdea) {
                    throw new Error('Backlog idea not found');
                }

                // Check if content item already exists for this backlog idea
                let contentItem = await SeoContentItem.findOne({
                    backlogIdeaId: args.input.backlogIdeaId
                }).exec();

                // Generate content using the service
                const generatedContent = await generateContent({
                    title: backlogIdea.title,
                    description: backlogIdea.description || undefined,
                    category: backlogIdea.category || "info",
                    contentType: "ARTICLE",
                    backlogIdeaId: args.input.backlogIdeaId,
                    projectId: args.input.projectId,
                    hypothesisId: args.input.hypothesisId,
                    userId: userId
                });

                // Create or update content item first
                if (contentItem) {
                    contentItem.content = generatedContent.content;
                    contentItem.outline = generatedContent.outline || contentItem.outline;
                    contentItem.updatedBy = userId;
                    contentItem.status = "draft";
                    await contentItem.save();
                } else {
                    contentItem = new SeoContentItem({
                        projectId: args.input.projectId,
                        hypothesisId: args.input.hypothesisId,
                        backlogIdeaId: args.input.backlogIdeaId,
                        title: backlogIdea.title,
                        category: backlogIdea.category || "info",
                        format: "blog",
                        outline: generatedContent.outline,
                        content: generatedContent.content,
                        status: "draft",
                        createdBy: userId,
                        updatedBy: userId
                    });
                    await contentItem.save();
                }

                // Store contentItemId for async image generation
                const contentItemId = contentItem._id.toString();

                // Generate image asynchronously (don't block response)
                generateImageForContent({
                    contentItemId: contentItemId,
                    title: backlogIdea.title,
                    description: backlogIdea.description || generatedContent.outline
                }).then((imageUrl) => {
                    // Update content item with image URL
                    SeoContentItem.findByIdAndUpdate(contentItemId, {
                        imageUrl: imageUrl,
                        updatedBy: userId
                    }).exec().catch((err) => {
                        console.error("[generateContentForBacklogIdea] Failed to update image URL:", err);
                    });
                }).catch((imageError) => {
                    console.error("[generateContentForBacklogIdea] Image generation failed:", imageError);
                    // Continue without image - content is already saved
                });

                return mapContentItem(contentItem);
            } catch (err) {
                elevateError(err);
            }
        },

        async generateImageForContent(
            _: never,
            args: {
                input: {
                    contentItemId: string;
                    title: string;
                    description?: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find content item and verify user has access
                const contentItem = await SeoContentItem.findById(args.input.contentItemId).exec();
                if (!contentItem) {
                    throw new Error('Content item not found');
                }

                await projectService.getProjectById(contentItem.projectId, userId);

                // Generate image
                const imageUrl = await generateImageForContent({
                    contentItemId: args.input.contentItemId,
                    title: args.input.title,
                    description: args.input.description
                });

                // Update content item with image URL
                contentItem.imageUrl = imageUrl;
                contentItem.updatedBy = userId;
                await contentItem.save();

                return mapContentItem(contentItem);
            } catch (err) {
                elevateError(err);
            }
        },

        async regenerateContent(
            _: never,
            args: {
                id: string;
                promptPart?: string;
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find content item and verify user has access
                const contentItem = await SeoContentItem.findById(args.id).exec();
                if (!contentItem) {
                    throw new Error('Content item not found');
                }

                await projectService.getProjectById(contentItem.projectId, userId);

                if (!contentItem.backlogIdeaId) {
                    throw new Error('Cannot regenerate: content item is not linked to a backlog idea');
                }

                // Find backlog idea
                const backlogIdea = await SeoBacklogIdea.findById(contentItem.backlogIdeaId).exec();
                if (!backlogIdea) {
                    throw new Error('Backlog idea not found');
                }

                // Build prompt with optional promptPart
                let description = backlogIdea.description || contentItem.outline || "";
                if (args.promptPart) {
                    description = `${description}\n\nAdditional instruction: ${args.promptPart}`;
                }

                // Regenerate content
                const generatedContent = await generateContent({
                    title: contentItem.title,
                    description: description,
                    category: contentItem.category,
                    contentType: "ARTICLE",
                    backlogIdeaId: contentItem.backlogIdeaId,
                    projectId: contentItem.projectId,
                    hypothesisId: contentItem.hypothesisId,
                    userId: userId
                });

                // Update content item
                contentItem.content = generatedContent.content;
                if (generatedContent.outline) {
                    contentItem.outline = generatedContent.outline;
                }
                contentItem.updatedBy = userId;
                await contentItem.save();

                return mapContentItem(contentItem);
            } catch (err) {
                elevateError(err);
            }
        },

        async upsertContentItem(
            _: never,
            args: {
                input: {
                    id?: string;
                    projectId: string;
                    hypothesisId: string;
                    backlogIdeaId?: string;
                    title: string;
                    category: string;
                    format: string;
                    ownerId?: string;
                    reviewerId?: string;
                    channel?: string;
                    outline?: string;
                    content?: string;
                    imageUrl?: string;
                    status?: string;
                    dueDate?: string;
                    userId?: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.input.projectId, userId);

                // Map GraphQL enums to database format
                const categoryLower = mapContentCategoryToDb(args.input.category);
                const formatLower = toLowerEnum(args.input.format);
                const statusLower = args.input.status ? toLowerEnum(args.input.status) : "draft";

                if (args.input.id) {
                    // Update existing content item
                    const contentItem = await SeoContentItem.findById(args.input.id).exec();
                    if (!contentItem) {
                        throw new Error('Content item not found');
                    }

                    await projectService.getProjectById(contentItem.projectId, userId);

                    contentItem.title = args.input.title;
                    contentItem.category = categoryLower as any;
                    contentItem.format = formatLower as any;
                    if (args.input.backlogIdeaId !== undefined) {
                        contentItem.backlogIdeaId = args.input.backlogIdeaId || undefined;
                    }
                    if (args.input.outline !== undefined) {
                        contentItem.outline = args.input.outline || undefined;
                    }
                    if (args.input.content !== undefined) {
                        contentItem.content = args.input.content || undefined;
                    }
                    if (args.input.imageUrl !== undefined) {
                        contentItem.imageUrl = args.input.imageUrl || undefined;
                    }
                    if (args.input.status) {
                        contentItem.status = statusLower as any;
                    }
                    if (args.input.ownerId !== undefined) {
                        contentItem.ownerId = args.input.ownerId || undefined;
                    }
                    if (args.input.reviewerId !== undefined) {
                        contentItem.reviewerId = args.input.reviewerId || undefined;
                    }
                    if (args.input.channel !== undefined) {
                        contentItem.channel = args.input.channel || undefined;
                    }
                    if (args.input.dueDate) {
                        contentItem.dueDate = new Date(args.input.dueDate);
                    }
                    contentItem.updatedBy = userId;
                    await contentItem.save();

                    return mapContentItem(contentItem);
                } else {
                    // Create new content item
                    const contentItem = new SeoContentItem({
                        projectId: args.input.projectId,
                        hypothesisId: args.input.hypothesisId,
                        backlogIdeaId: args.input.backlogIdeaId || undefined,
                        title: args.input.title,
                        category: categoryLower as any,
                        format: formatLower as any,
                        ownerId: args.input.ownerId || undefined,
                        reviewerId: args.input.reviewerId || undefined,
                        channel: args.input.channel || undefined,
                        outline: args.input.outline || undefined,
                        content: args.input.content || undefined,
                        imageUrl: args.input.imageUrl || undefined,
                        status: statusLower as any,
                        dueDate: args.input.dueDate ? new Date(args.input.dueDate) : undefined,
                        createdBy: userId,
                        updatedBy: userId
                    });
                    await contentItem.save();

                    return mapContentItem(contentItem);
                }
            } catch (err) {
                elevateError(err);
            }
        },

        async approveContentItem(
            _: never,
            args: {
                input: {
                    contentItemId: string;
                    projectId: string;
                    hypothesisId?: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find content item and verify user has access
                const contentItem = await SeoContentItem.findById(args.input.contentItemId).exec();
                if (!contentItem) {
                    throw new Error('Content item not found');
                }

                await projectService.getProjectById(contentItem.projectId, userId);

                // Update status to ready
                contentItem.status = "ready";
                contentItem.updatedBy = userId;
                await contentItem.save();

                return mapContentItem(contentItem);
            } catch (err) {
                elevateError(err);
            }
        },

        async rewriteTextSelection(
            _: never,
            args: {
                input: {
                    contentItemId: string;
                    selectedText: string;
                    contextBefore?: string;
                    contextAfter?: string;
                    instruction: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find content item and verify user has access
                const contentItem = await SeoContentItem.findById(args.input.contentItemId).exec();
                if (!contentItem) {
                    throw new Error('Content item not found');
                }

                await projectService.getProjectById(contentItem.projectId, userId);

                // Use OpenAI to rewrite the selected text
                const OpenAI = (await import("openai")).default;
                const { config } = await import("../../constants/config/env");
                const apiKey = process.env.OPENAI_API_KEY || config.SEO_AGENT.openAiApiKey;
                
                if (!apiKey) {
                    throw new Error("OPENAI_API_KEY not configured");
                }

                const openai = new OpenAI({ apiKey });

                const prompt = `You are a professional content editor. Rewrite the following selected text according to the user's instruction.

Context before selection:
${args.input.contextBefore || "N/A"}

Selected text to rewrite:
${args.input.selectedText}

Context after selection:
${args.input.contextAfter || "N/A"}

User's instruction: ${args.input.instruction}

Please rewrite ONLY the selected text according to the instruction. Return only the rewritten text without any additional explanation or context.`;

                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "system",
                            content: "You are a professional content editor. Rewrite text according to user instructions while maintaining the overall tone and style."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000
                });

                const rewrittenText = completion.choices[0]?.message?.content || args.input.selectedText;

                return {
                    success: true,
                    rewrittenText: rewrittenText,
                    error: null
                };
            } catch (err: any) {
                console.error("[rewriteTextSelection] Error:", err);
                return {
                    success: false,
                    rewrittenText: null,
                    error: err.message || "Failed to rewrite text"
                };
            }
        },

        async deleteContentItem(
            _: never,
            args: { id: string },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find content item and verify user has access
                const contentItem = await SeoContentItem.findById(args.id).exec();
                if (!contentItem) {
                    throw new Error('Content item not found');
                }

                await projectService.getProjectById(contentItem.projectId, userId);

                await SeoContentItem.findByIdAndDelete(args.id).exec();

                return true;
            } catch (err) {
                elevateError(err);
            }
        },

        async generateContentIdeas(
            _: never,
            args: {
                projectId: string;
                hypothesisId: string;
                category?: string;
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);
                
                // Verify user has access to this project
                await projectService.getProjectById(args.projectId, userId);

                // Load SEO context
                const seoContext = await loadSeoContext(args.projectId, args.hypothesisId, userId);

                // Generate ideas
                const category = args.category || "INFORMATIONAL";
                const categoryForDb = mapContentCategoryToDb(category);
                const ideas = await generateIdeasFromOpenAI({
                    context: seoContext,
                    category: categoryForDb,
                    count: 5,
                    language: seoContext.language || "English"
                });

                // Map to ContentIdea format and save to database
                const contentIdeas = await Promise.all(
                    ideas.map(async (idea) => {
                        // Check for duplicates
                        const existing = await SeoContentItem.findOne({
                            projectId: args.projectId,
                            hypothesisId: args.hypothesisId,
                            title: idea.title
                        }).exec();

                        if (existing) {
                            return mapContentIdea(existing);
                        }

                        // Create new content idea
                        const contentItem = new SeoContentItem({
                            projectId: args.projectId,
                            hypothesisId: args.hypothesisId,
                            title: idea.title,
                            category: categoryForDb as any,
                            format: "blog",
                            outline: idea.summary,
                            status: "draft",
                            createdBy: userId,
                            updatedBy: userId
                        });
                        await contentItem.save();

                        return mapContentIdea(contentItem);
                    })
                );

                return contentIdeas;
            } catch (err) {
                elevateError(err);
            }
        },

        async publishToWordPress(
            _: never,
            args: {
                input: {
                    contentItemId: string;
                    projectId: string;
                    hypothesisId?: string;
                    status?: string;
                };
            },
            context: IContext
        ) {
            try {
                const userId = authService.getUserIdFromToken(context.token);

                // Find content item and verify user has access
                const contentItem = await SeoContentItem.findById(args.input.contentItemId).exec();
                if (!contentItem) {
                    throw new Error('Content item not found');
                }

                await projectService.getProjectById(contentItem.projectId, userId);

                // Get WordPress settings from project
                const { SeoSprintSettings } = await import('../../db/models/SeoSprintSettings');
                const settings = await SeoSprintSettings.findOne({
                    projectId: args.input.projectId,
                    hypothesisId: args.input.hypothesisId
                }).exec();

                if (!settings?.wordpressBaseUrl || !settings.wordpressUsername || !settings.wordpressAppPassword) {
                    return {
                        success: false,
                        wordPressPostId: null,
                        wordPressPostUrl: null,
                        error: "WordPress credentials not configured. Please configure WordPress settings first."
                    };
                }

                // Initialize WordPress client
                wordpressClient.initialize({
                    baseUrl: settings.wordpressBaseUrl,
                    username: settings.wordpressUsername,
                    appPassword: settings.wordpressAppPassword
                });

                // Map content item to WordPress post
                const { mapContentItemToWordPressPost } = await import('../../services/seoAgent/wordpress/mapper');
                const wordPressPost = await mapContentItemToWordPressPost(
                    contentItem,
                    settings,
                    args.input.status === "future" ? new Date() : undefined
                );
                
                // Override status if provided
                if (args.input.status) {
                    wordPressPost.status = args.input.status as any;
                }

                // Publish to WordPress
                const result = await wordpressClient.publishPost(wordPressPost);

                // Update content item status
                contentItem.status = "published";
                contentItem.updatedBy = userId;
                await contentItem.save();

                return {
                    success: true,
                    wordPressPostId: result.id,
                    wordPressPostUrl: result.link,
                    error: null
                };
            } catch (err: any) {
                console.error("[publishToWordPress] Error:", err);
                return {
                    success: false,
                    wordPressPostId: null,
                    wordPressPostUrl: null,
                    error: err.message || "Failed to publish to WordPress"
                };
            }
        },

        async testWordPressConnection(
            _: never,
            args: {
                input: {
                    wordpressBaseUrl: string;
                    wordpressUsername: string;
                    wordpressAppPassword: string;
                    postType?: string;
                };
            },
            context: IContext
        ) {
            try {
                // Initialize WordPress client with provided credentials
                wordpressClient.initialize({
                    baseUrl: args.input.wordpressBaseUrl,
                    username: args.input.wordpressUsername,
                    appPassword: args.input.wordpressAppPassword
                });

                // Test connection
                const result = await wordpressClient.testConnection();

                return {
                    success: result.success,
                    message: result.success ? "Connection successful" : undefined,
                    error: result.error || null
                };
            } catch (err: any) {
                console.error("[testWordPressConnection] Error:", err);
                return {
                    success: false,
                    message: undefined,
                    error: err.message || "Failed to test WordPress connection"
                };
            }
        },

        async logFrontendMessage(
            _: never,
            args: {
                level: string;
                message: string;
                data?: string;
            },
            context: IContext
        ) {
            try {
                const logLevel = args.level.toUpperCase();
                const logData = args.data ? JSON.parse(args.data) : undefined;

                // Only log errors to console
                if (logLevel === "ERROR") {
                    console.error("[Frontend]", args.message, logData);
                }

                return true;
            } catch (err) {
                // Don't fail on logging errors
                console.error("[logFrontendMessage] Error:", err);
                return true;
            }
        },
    },
};

export default seoAgentMutationResolver;

