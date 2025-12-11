import { SeoBacklogIdea } from "../../db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../../db/models/SeoContentItem.js";
import { SeoSprintSettings } from "../../db/models/SeoSprintSettings.js";
import { wordpressClient } from "./apiClient.js";
import { mapContentItemToWordPressPost } from "./mapper.js";

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
    console.log(`[autoPublish] ===== НАЧАЛО АВТОПУБЛИКАЦИИ =====`);
    console.log(`[autoPublish] Текущее время: ${now.toISOString()}`);
    
    // Find all backlog items that are scheduled and due for publishing
    // Conditions:
    // 1. Status is "scheduled"
    // 2. scheduledDate is less than or equal to now (time to publish)
    const scheduledItems = await SeoBacklogIdea.find({
      status: "scheduled",
      scheduledDate: { $lte: now },
    }).exec();

    console.log(`[autoPublish] Найдено ${scheduledItems.length} элементов для публикации`);
    
    if (scheduledItems.length === 0) {
      console.log(`[autoPublish] Нет элементов для публикации`);
      return { published: 0, failed: 0, errors: [] };
    }

    for (const backlogItem of scheduledItems) {
      try {
        console.log(`[autoPublish] Обработка элемента: ${backlogItem.id} - "${backlogItem.title}"`);
        console.log(`[autoPublish] Запланированная дата: ${backlogItem.scheduledDate?.toISOString()}`);
        
        // Find associated content item that is ready for publishing
        // Condition: content status must be "ready" (not draft)
        const contentItem = await SeoContentItem.findOne({
          backlogIdeaId: backlogItem.id,
          status: "ready",
        }).exec();

        if (!contentItem) {
          console.warn(`[autoPublish] ⚠️ Контент не готов для публикации (не найден или статус не "ready") для backlog item ${backlogItem.id}`);
          console.warn(`[autoPublish] Проверка: backlogIdeaId=${backlogItem.id}, status="ready"`);
          errors.push(`Content not ready for backlog item ${backlogItem.id}`);
          continue;
        }
        
        console.log(`[autoPublish] ✅ Контент найден: ${contentItem.id}, статус: ${contentItem.status}`);

        // Get WordPress settings for this project
        // Condition: WordPress must be configured and autoPublishEnabled must be true
        const settings = await SeoSprintSettings.findOne({
          projectId: backlogItem.projectId,
          hypothesisId: backlogItem.hypothesisId,
        }).exec();

        if (!settings || !settings.wordpressBaseUrl || !settings.wordpressUsername || !settings.wordpressAppPassword) {
          console.warn(`[autoPublish] ⚠️ WordPress не настроен для проекта ${backlogItem.projectId}`);
          errors.push(`WordPress not configured for project ${backlogItem.projectId}`);
          continue;
        }
        
        if (!settings.autoPublishEnabled) {
          console.log(`[autoPublish] ⏭️ Автопубликация отключена для проекта ${backlogItem.projectId}`);
          continue;
        }
        
        console.log(`[autoPublish] ✅ WordPress настроен, автопубликация включена`);

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
        console.log(`[autoPublish] Проверка изображения:`, {
          hasImageUrl: !!contentItem.imageUrl,
          imageUrlPreview: contentItem.imageUrl ? contentItem.imageUrl.substring(0, 50) + "..." : null,
          hasSettings: !!(settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword)
        });
        
        if (contentItem.imageUrl && settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword) {
          try {
            console.log(`[autoPublish] 🖼️  Начинаю загрузку изображения...`);
            const { uploadImageToWordPress } = await import("./imageUpload.js");
            const mediaId = await uploadImageToWordPress(contentItem.imageUrl, {
              baseUrl: settings.wordpressBaseUrl.replace(/\/$/, ""),
              username: settings.wordpressUsername,
              appPassword: settings.wordpressAppPassword
            });
            if (mediaId) {
              wpPost.featured_media = mediaId;
              console.log(`[autoPublish] ✅ Featured image uploaded, media ID: ${mediaId}`);
            } else {
              console.warn(`[autoPublish] ⚠️ Не удалось загрузить изображение: ${contentItem.imageUrl?.substring(0, 100)}...`);
            }
          } catch (error: any) {
            console.error(`[autoPublish] ❌ Ошибка загрузки изображения:`, error.message);
            console.error(`[autoPublish] Stack:`, error.stack);
            // Continue without image if upload fails
          }
        } else {
          console.log(`[autoPublish] ⚠️ Изображение не будет загружено:`, {
            hasImageUrl: !!contentItem.imageUrl,
            hasSettings: !!(settings?.wordpressBaseUrl && settings?.wordpressUsername && settings?.wordpressAppPassword)
          });
        }

        // Publish to WordPress - WAIT for explicit confirmation
        console.log(`[autoPublish] ===== НАЧАЛО ПУБЛИКАЦИИ =====`);
        console.log(`[autoPublish] Content Item ID: ${contentItem.id}`);
        console.log(`[autoPublish] Backlog Item ID: ${backlogItem.id}`);
        console.log(`[autoPublish] Отправка контента в WordPress...`);
        
        const result = await wordpressClient.publishPost(wpPost);
        
        // CRITICAL: Only proceed if we got explicit confirmation from WordPress
        // Status "published" should ONLY be set after WordPress confirms publication
        if (!result || !result.id || !result.link) {
          console.error(`[autoPublish] ❌ WordPress не вернул подтверждение публикации для ${backlogItem.id}!`);
          console.error(`[autoPublish] Ответ от WordPress:`, result);
          console.error(`[autoPublish] Статус НЕ будет изменен на "published"`);
          throw new Error("WordPress did not confirm publication. Missing post ID or link.");
        }
        
        console.log(`[autoPublish] ✅ WordPress подтвердил публикацию:`, {
          postId: result.id,
          link: result.link,
          backlogItemId: backlogItem.id
        });
        console.log(`[autoPublish] Теперь можно обновить статус на "published"`);

        // CRITICAL: Status "published" should ONLY be set after WordPress confirms publication
        // This is the ONLY place in autoPublish where status should be set to "published"
        // We have explicit confirmation: result.id and result.link exist
        console.log(`[autoPublish] Обновление статуса content item на "published" (после подтверждения от WordPress)...`);
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
        
        console.log(`[autoPublish] ✅ Content item статус обновлен на "published" (подтверждено WordPress)`);

        // Update backlog item status to IN_PROGRESS (published, but keep in sprint)
        // Don't archive - keep visible in sprint so user can see what was published
        // ONLY update after WordPress confirmed publication AND content item status is "published"
        console.log(`[autoPublish] Обновление статуса backlog item на IN_PROGRESS...`);
        await SeoBacklogIdea.findByIdAndUpdate(
          backlogItem.id,
          {
            status: "in_progress", // Keep in sprint after publishing
            updatedBy: "system",
          },
          { new: true }
        ).exec();
        console.log(`[autoPublish] ✅ Обновлен статус backlog item ${backlogItem.id} на IN_PROGRESS (опубликован, остается в спринте)`);
        
        console.log(`[autoPublish] ===== ПУБЛИКАЦИЯ ЗАВЕРШЕНА УСПЕШНО =====`);
        console.log(`[autoPublish] Итоговые статусы:`, {
          contentItemStatus: updatedContentItem.status,
          backlogItemStatus: "in_progress",
          wordPressPostId: result.id,
          wordPressPostUrl: result.link
        });

        published.push(backlogItem.id);
        console.log(`[autoPublish] Successfully published "${contentItem.title}" to WordPress: ${result.link}`);
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

