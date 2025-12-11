import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoSprintSettings } from "../src/db/models/SeoSprintSettings.js";
import { wordpressClient } from "../src/services/wordpress/apiClient.js";
import { mapContentItemToWordPressPost } from "../src/services/wordpress/mapper.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function findProjectWithWordPressSettings() {
  const settings = await SeoSprintSettings.findOne({
    wordpressBaseUrl: { $exists: true, $ne: null },
    wordpressUsername: { $exists: true, $ne: null },
    wordpressAppPassword: { $exists: true, $ne: null }
  }).exec();
  
  if (settings) {
    return {
      projectId: settings.projectId,
      hypothesisId: settings.hypothesisId,
      settings
    };
  }
  return null;
}

async function main() {
  console.log("🧪 ===== ПОЛНОЕ ТЕСТИРОВАНИЕ ПУБЛИКАЦИИ С ИЗОБРАЖЕНИЕМ =====");
  
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  const project = await findProjectWithWordPressSettings();
  if (!project) {
    console.error("❌ Не найден проект с настройками WordPress");
    process.exit(1);
  }
  
  console.log("📋 Проект:", project.projectId);
  console.log("📋 Hypothesis:", project.hypothesisId);
  console.log("📋 WordPress Post Type:", (project.settings as any).wordpressPostType || "post");
  
  // Find or create test backlog item
  let backlogItem = await SeoBacklogIdea.findOne({
    projectId: project.projectId,
    hypothesisId: project.hypothesisId,
    title: { $regex: /Тестовый пост для публикации/ }
  }).exec();
  
  if (!backlogItem) {
    console.log("\n📝 Создание нового backlog item...");
    backlogItem = await SeoBacklogIdea.create({
      projectId: project.projectId,
      hypothesisId: project.hypothesisId,
      title: `Тестовый пост с изображением - ${new Date().toLocaleString('ru-RU')}`,
      description: "Тестовый материал с изображением для проверки публикации",
      status: "pending",
      category: "info",
      createdBy: "system",
      updatedBy: "system"
    });
  }
  
  console.log("\n📝 Backlog Item:", backlogItem.id);
  
  // Find or create content item with image
  let contentItem = await SeoContentItem.findOne({
    backlogIdeaId: backlogItem.id
  }).exec();
  
  if (!contentItem || !contentItem.imageUrl) {
    console.log("\n📄 Создание/обновление content item с изображением...");
    
    // Use a test image URL (можно использовать реальное изображение)
    const testImageUrl = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800";
    
    if (contentItem) {
      contentItem.imageUrl = testImageUrl;
      contentItem.status = "ready";
      await contentItem.save();
    } else {
      contentItem = await SeoContentItem.create({
        projectId: project.projectId,
        hypothesisId: project.hypothesisId,
        backlogIdeaId: backlogItem.id,
        title: backlogItem.title,
        outline: "Тестовый пост с изображением для проверки публикации в WordPress",
        content: `
          <h1>Тестовый пост с изображением</h1>
          <p>Этот пост создан для тестирования публикации в WordPress с изображением, заголовком и текстом.</p>
          <p>Дата создания: ${new Date().toLocaleString('ru-RU')}</p>
          <h2>Проверка элементов</h2>
          <p>Этот пост должен содержать:</p>
          <ul>
            <li>✅ Заголовок</li>
            <li>✅ Изображение (featured image)</li>
            <li>✅ Основной текст</li>
            <li>✅ Правильный тип поста (blog)</li>
          </ul>
          <p>Если вы видите этот пост на странице https://trygo.io/blog/ с изображением, значит все работает правильно!</p>
        `,
        category: "info",
        format: "blog",
        status: "ready",
        imageUrl: testImageUrl,
        createdBy: "system",
        updatedBy: "system"
      });
    }
  }
  
  console.log("📄 Content Item:", contentItem.id);
  console.log("🖼️  Image URL:", contentItem.imageUrl);
  
  // Initialize WordPress client
  wordpressClient.initialize({
    baseUrl: project.settings.wordpressBaseUrl!.replace(/\/$/, ""),
    username: project.settings.wordpressUsername!,
    appPassword: project.settings.wordpressAppPassword!
  });
  
  // Map to WordPress post
  console.log("\n📄 Маппинг в WordPress post...");
  const wpPost = await mapContentItemToWordPressPost(contentItem, project.settings);
  
  console.log("✅ WordPress post подготовлен:");
  console.log("   Title:", wpPost.title);
  console.log("   Type:", wpPost.type);
  console.log("   Featured Media ID:", wpPost.featured_media || "не установлено");
  console.log("   Content length:", wpPost.content?.length || 0);
  
  // Publish
  console.log("\n🚀 Публикация в WordPress...");
  const result = await wordpressClient.publishPost(wpPost);
  
  if (!result || !result.id || !result.link) {
    console.error("❌ Публикация не удалась");
    process.exit(1);
  }
  
  console.log("✅ Пост опубликован!");
  console.log("   Post ID:", result.id);
  console.log("   URL:", result.link);
  console.log("\n💡 Проверьте пост на https://trygo.io/blog/");
  console.log("   Должны быть видны: заголовок, изображение, текст");
  
  // Update statuses
  contentItem.status = "published";
  await contentItem.save();
  
  backlogItem.status = "in_progress";
  await backlogItem.save();
  
  console.log("\n✅ Статусы обновлены");
  
  await mongoose.disconnect();
}

main();
