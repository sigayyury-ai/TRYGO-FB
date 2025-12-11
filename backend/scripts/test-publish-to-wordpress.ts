/**
 * Test script to publish a post to WordPress for December 9
 * This script tests the full publish flow:
 * 1. Find or create a backlog item
 * 2. Create/update content item
 * 3. Schedule it for December 9
 * 4. Publish to WordPress
 * 5. Verify publication
 */

import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoSprintSettings } from "../src/db/models/SeoSprintSettings.js";
import { wordpressClient } from "../src/services/wordpress/apiClient.js";
import { mapContentItemToWordPressPost } from "../src/services/wordpress/mapper.js";
import { env } from "../src/config/env.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

// Test configuration
const TEST_PROJECT_ID = process.env.TEST_PROJECT_ID || "";
const TEST_HYPOTHESIS_ID = process.env.TEST_HYPOTHESIS_ID || "";
const TEST_DATE = new Date("2024-12-09T10:00:00Z"); // December 9, 2024

// If project/hypothesis not provided, find first available one with WordPress settings
async function findProjectWithWordPressSettings() {
  const settings = await SeoSprintSettings.findOne({
    wordpressBaseUrl: { $exists: true, $ne: null },
    wordpressUsername: { $exists: true, $ne: null },
    wordpressAppPassword: { $exists: true, $ne: null }
  }).exec();
  
  if (settings) {
    return {
      projectId: settings.projectId,
      hypothesisId: settings.hypothesisId
    };
  }
  return null;
}

async function main() {
  console.log("🧪 ===== ТЕСТ ПУБЛИКАЦИИ В WORDPRESS =====");
  console.log("📅 Дата публикации:", TEST_DATE.toISOString());
  console.log("🌐 WordPress URL:", env.wordpressBaseUrl || "NOT SET");
  
  try {
    // Connect to MongoDB
    console.log("\n📦 Подключение к MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB");

    // Try to find project/hypothesis if not provided
    let projectId = TEST_PROJECT_ID;
    let hypothesisId = TEST_HYPOTHESIS_ID;
    
    if (!projectId || !hypothesisId) {
      console.log("🔍 Поиск проекта с WordPress настройками...");
      const found = await findProjectWithWordPressSettings();
      if (found) {
        projectId = found.projectId;
        hypothesisId = found.hypothesisId;
        console.log("✅ Найден проект:", projectId, "hypothesis:", hypothesisId);
      } else {
        console.error("❌ TEST_PROJECT_ID и TEST_HYPOTHESIS_ID должны быть установлены");
        console.log("💡 Используйте: TEST_PROJECT_ID=xxx TEST_HYPOTHESIS_ID=yyy tsx scripts/test-publish-to-wordpress.ts");
        process.exit(1);
      }
    }

    // 1. Get or create a backlog item
    console.log("\n📋 Шаг 1: Поиск backlog item...");
    let backlogItem = await SeoBacklogIdea.findOne({
      projectId: projectId,
      hypothesisId: hypothesisId,
      status: { $in: ["pending", "scheduled", "in_progress"] }
    }).exec();

    if (!backlogItem) {
      console.log("📝 Создание нового backlog item...");
      backlogItem = await SeoBacklogIdea.create({
        projectId: projectId,
        hypothesisId: hypothesisId,
        title: `Test Post for December 9, 2024 - ${new Date().toISOString()}`,
        description: "Test post created by publish test script",
        status: "pending",
        category: "info", // Use "info" instead of "informational"
        createdBy: "system",
        updatedBy: "system"
      });
      console.log("✅ Создан backlog item:", backlogItem.id);
    } else {
      console.log("✅ Найден backlog item:", backlogItem.id, "-", backlogItem.title);
    }

    // 2. Get or create content item
    console.log("\n📝 Шаг 2: Поиск content item...");
    let contentItem = await SeoContentItem.findOne({
      backlogIdeaId: backlogItem.id,
      status: { $in: ["ready", "published"] }
    }).exec();

    if (!contentItem) {
      console.log("📝 Создание нового content item...");
      contentItem = await SeoContentItem.create({
        projectId: projectId,
        hypothesisId: hypothesisId,
        backlogIdeaId: backlogItem.id,
        title: backlogItem.title,
        outline: "Test post outline for December 9 publication",
        content: `
          <h1>Test Post for December 9, 2024</h1>
          <p>This is a test post created by the publish test script.</p>
          <p>Published on: ${new Date().toISOString()}</p>
          <p>This post is scheduled for December 9, 2024.</p>
          <h2>Test Content</h2>
          <p>This content is being used to test the WordPress publishing functionality.</p>
          <p>If you see this post on trygo.io, the publishing flow is working correctly!</p>
        `,
        category: "info", // Use "info" instead of "informational"
        format: "blog",
        status: "ready",
        createdBy: "system",
        updatedBy: "system"
      });
      console.log("✅ Создан content item:", contentItem.id);
    } else {
      console.log("✅ Найден content item:", contentItem.id);
      // Update content to mark it as ready
      if (contentItem.status !== "ready" && contentItem.status !== "published") {
        contentItem.status = "ready";
        await contentItem.save();
        console.log("✅ Обновлен статус content item на 'ready'");
      }
    }

    // 3. Get WordPress settings
    console.log("\n⚙️ Шаг 3: Получение WordPress настроек...");
    const settings = await SeoSprintSettings.findOne({
      projectId: projectId,
      hypothesisId: hypothesisId
    }).exec();

    if (!settings || !settings.wordpressBaseUrl || !settings.wordpressUsername || !settings.wordpressAppPassword) {
      console.error("❌ WordPress настройки не найдены или неполные!");
      console.error("💡 Убедитесь, что настройки WordPress сохранены в SeoPostingSettingsPanel");
      process.exit(1);
    }

    console.log("✅ WordPress настройки найдены:");
    console.log("   URL:", settings.wordpressBaseUrl);
    console.log("   Username:", settings.wordpressUsername);
    console.log("   App Password:", settings.wordpressAppPassword ? "***SET***" : "NOT SET");

    // 4. Initialize WordPress client
    console.log("\n🔌 Шаг 4: Инициализация WordPress client...");
    wordpressClient.initialize({
      baseUrl: settings.wordpressBaseUrl.replace(/\/$/, ""),
      username: settings.wordpressUsername,
      appPassword: settings.wordpressAppPassword
    });
    console.log("✅ WordPress client инициализирован");

    // 5. Test connection
    console.log("\n🔍 Шаг 5: Тестирование подключения к WordPress...");
    const connectionTest = await wordpressClient.testConnection();
    if (!connectionTest.success) {
      console.error("❌ Ошибка подключения к WordPress:", connectionTest.error);
      process.exit(1);
    }
    console.log("✅ Подключение к WordPress успешно");

    // 6. Map content to WordPress post
    console.log("\n📄 Шаг 6: Маппинг content item в WordPress post...");
    const wpPost = mapContentItemToWordPressPost(contentItem, settings, TEST_DATE);
    console.log("✅ WordPress post подготовлен:");
    console.log("   Title:", wpPost.title);
    console.log("   Status:", wpPost.status);
    console.log("   Date:", wpPost.date);
    console.log("   Categories:", wpPost.categories);
    console.log("   Tags:", wpPost.tags);

    // 7. Publish to WordPress
    console.log("\n🚀 Шаг 7: Публикация в WordPress...");
    console.log("📅 Дата публикации:", TEST_DATE.toISOString());
    
    const result = await wordpressClient.publishPost(wpPost);
    
    if (!result || !result.id || !result.link) {
      console.error("❌ WordPress не вернул подтверждение публикации!");
      console.error("Ответ:", result);
      process.exit(1);
    }

    console.log("✅ WordPress подтвердил публикацию!");
    console.log("   Post ID:", result.id);
    console.log("   Post URL:", result.link);

    // 8. Update content item status
    console.log("\n🔄 Шаг 8: Обновление статусов...");
    contentItem.status = "published";
    await contentItem.save();
    console.log("✅ Content item статус обновлен на 'published'");

    // 9. Update backlog item status
    backlogItem.status = "in_progress";
    backlogItem.scheduledDate = TEST_DATE;
    await backlogItem.save();
    console.log("✅ Backlog item статус обновлен на 'in_progress'");
    console.log("✅ Scheduled date установлен:", TEST_DATE.toISOString());

    // 10. Final summary
    console.log("\n✅ ===== ПУБЛИКАЦИЯ ЗАВЕРШЕНА УСПЕШНО =====");
    console.log("📝 Backlog Item ID:", backlogItem.id);
    console.log("📄 Content Item ID:", contentItem.id);
    console.log("🌐 WordPress Post ID:", result.id);
    console.log("🔗 WordPress Post URL:", result.link);
    console.log("📅 Дата публикации:", TEST_DATE.toISOString());
    console.log("\n💡 Проверьте пост на сайте:", result.link);

  } catch (error: any) {
    console.error("\n❌ ===== ОШИБКА ПУБЛИКАЦИИ =====");
    console.error("Ошибка:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n📦 Отключено от MongoDB");
  }
}

main();
