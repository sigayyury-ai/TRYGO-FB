import { SeoBacklogIdea } from "../../../db/models/SeoBacklogIdea";
import { SeoContentItem } from "../../../db/models/SeoContentItem";
import { SeoSprintSettings } from "../../../db/models/SeoSprintSettings";
import { wordpressClient } from "./apiClient";
import { mapContentItemToWordPressPost } from "./mapper";

/**
 * Auto-publish scheduled content to WordPress
 * This function should be called periodically (e.g., via cron job)
 */
export const autoPublishScheduledContent = async (): Promise<{
  published: number;
  failed: number;
  errors: string[];
}> => {
  const now = new Date();
  const published: string[] = [];
  const failed: string[] = [];
  const errors: string[] = [];

  try {
    // Find all backlog items that are scheduled and due for publishing
    // Conditions:
    // 1. Status is "scheduled"
    // 2. scheduledDate is less than or equal to now (time to publish)
    const scheduledItems = await SeoBacklogIdea.find({
      status: "scheduled",
      scheduledDate: { $lte: now },
    }).exec();
    
    if (scheduledItems.length === 0) {
      return { published: 0, failed: 0, errors: [] };
    }

    for (const backlogItem of scheduledItems) {
      try {
        // Find associated content item that is ready for publishing
        // Condition: content status must be "ready" (not draft)
        const contentItem = await SeoContentItem.findOne({
          backlogIdeaId: backlogItem.id,
          status: "ready",
        }).exec();

        if (!contentItem) {
          errors.push(`Content not ready for backlog item ${backlogItem.id}`);
          continue;
        }

        // Get WordPress settings for this project
        // Condition: WordPress must be configured and autoPublishEnabled must be true
        const settings = await SeoSprintSettings.findOne({
          projectId: backlogItem.projectId,
          hypothesisId: backlogItem.hypothesisId,
        }).exec();

        if (!settings || !settings.wordpressBaseUrl || !settings.wordpressUsername || !settings.wordpressAppPassword) {
          errors.push(`WordPress not configured for project ${backlogItem.projectId}`);
          continue;
        }
        
        if (!settings.autoPublishEnabled) {
          continue;
        }

        // Initialize WordPress client with project-specific settings
        wordpressClient.initialize({
          baseUrl: settings.wordpressBaseUrl,
          username: settings.wordpressUsername,
          appPassword: settings.wordpressAppPassword,
        });

        // Prepare WordPress post using mapper
        const wpPost = await mapContentItemToWordPressPost(
          contentItem,
          settings,
          backlogItem.scheduledDate || undefined
        );

        // Upload featured image if available
        if (contentItem.imageUrl && settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword) {
          try {
            const { uploadImageToWordPress } = await import("./imageUpload");
            const mediaId = await uploadImageToWordPress(contentItem.imageUrl, {
              baseUrl: settings.wordpressBaseUrl.replace(/\/$/, ""),
              username: settings.wordpressUsername,
              appPassword: settings.wordpressAppPassword
            });
            if (mediaId) {
              wpPost.featured_media = mediaId;
            }
          } catch (error: any) {
            console.error(`[autoPublish] ❌ Ошибка загрузки изображения:`, error.message);
            // Continue without image if upload fails
          }
        }

        // Publish to WordPress - WAIT for explicit confirmation
        const result = await wordpressClient.publishPost(wpPost);
        
        // CRITICAL: Only proceed if we got explicit confirmation from WordPress
        // Status "published" should ONLY be set after WordPress confirms publication
        if (!result || !result.id || !result.link) {
          console.error(`[autoPublish] ❌ WordPress не вернул подтверждение публикации для ${backlogItem.id}!`);
          throw new Error("WordPress did not confirm publication. Missing post ID or link.");
        }

        // CRITICAL: Status "published" should ONLY be set after WordPress confirms publication
        // This is the ONLY place in autoPublish where status should be set to "published"
        // We have explicit confirmation: result.id and result.link exist
        const updatedContentItem = await SeoContentItem.findByIdAndUpdate(
          contentItem.id,
          {
            status: "published",
            updatedBy: "system",
          },
          { new: true }
        ).exec();
        
        if (!updatedContentItem) {
          console.error(`[autoPublish] ❌ Не удалось обновить content item!`);
          throw new Error("Failed to update content item status");
        }
        
        // Verify status was actually updated
        if (updatedContentItem.status !== "published") {
          console.error(`[autoPublish] ❌ Статус не был обновлен на "published"! Текущий статус: ${updatedContentItem.status}`);
          throw new Error(`Failed to update content item status to published. Current status: ${updatedContentItem.status}`);
        }

        // Update backlog item status to IN_PROGRESS (published, but keep in sprint)
        // Don't archive - keep visible in sprint so user can see what was published
        // ONLY update after WordPress confirmed publication AND content item status is "published"
        await SeoBacklogIdea.findByIdAndUpdate(
          backlogItem.id,
          {
            status: "in_progress", // Keep in sprint after publishing
            updatedBy: "system",
          },
          { new: true }
        ).exec();

        published.push(backlogItem.id);
      } catch (error: any) {
        const errorMsg = `Failed to publish backlog item ${backlogItem.id}: ${error.message}`;
        console.error(`[autoPublish] ${errorMsg}`, error);
        failed.push(backlogItem.id);
        errors.push(errorMsg);
      }
    }

    return {
      published: published.length,
      failed: failed.length,
      errors,
    };
  } catch (error: any) {
    console.error("[autoPublish] Fatal error:", error);
    throw error;
  }
};

