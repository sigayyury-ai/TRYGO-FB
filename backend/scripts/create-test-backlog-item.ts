import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

// Test configuration - find first project with WordPress settings
async function findProjectWithWordPressSettings() {
  const { SeoSprintSettings } = await import("../src/db/models/SeoSprintSettings.js");
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
  console.log("🧪 ===== СОЗДАНИЕ ТЕСТОВОГО МАТЕРИАЛА В БЕКЛОГЕ =====");
  
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  // Find project with WordPress settings
  const project = await findProjectWithWordPressSettings();
  if (!project) {
    console.error("❌ Не найден проект с настройками WordPress");
    process.exit(1);
  }
  
  console.log("📋 Найден проект:", project.projectId);
  console.log("📋 Hypothesis:", project.hypothesisId);
  
  // Create backlog item
  console.log("\n📝 Создание backlog item...");
  const backlogItem = await SeoBacklogIdea.create({
    projectId: project.projectId,
    hypothesisId: project.hypothesisId,
    title: `Тестовый пост для публикации - ${new Date().toLocaleString('ru-RU')}`,
    description: "Тестовый материал создан для проверки публикации в WordPress с типом 'blog'",
    status: "pending",
    category: "info",
    createdBy: "system",
    updatedBy: "system"
  });
  
  console.log("✅ Backlog item создан:", backlogItem.id);
  console.log("   Заголовок:", backlogItem.title);
  
  // Create content item
  console.log("\n📄 Создание content item...");
  const contentItem = await SeoContentItem.create({
    projectId: project.projectId,
    hypothesisId: project.hypothesisId,
    backlogIdeaId: backlogItem.id,
    title: backlogItem.title,
    outline: "Тестовый пост для проверки публикации в WordPress с правильным типом поста 'blog'",
    content: `
      <h1>Тестовый пост для публикации</h1>
      <p>Этот пост создан для тестирования публикации в WordPress с типом поста "blog".</p>
      <p>Дата создания: ${new Date().toLocaleString('ru-RU')}</p>
      <h2>Проверка публикации</h2>
      <p>После публикации этот пост должен появиться на сайте trygo.io с типом "blog", а не "post".</p>
      <h3>Что проверяем:</h3>
      <ul>
        <li>Правильный тип поста (blog)</li>
        <li>Публикация в правильную категорию</li>
        <li>Обновление статусов после публикации</li>
        <li>Элемент остается в спринте после публикации</li>
      </ul>
      <p>Если вы видите этот пост на сайте, значит публикация прошла успешно!</p>
    `,
    category: "info",
    format: "blog",
    status: "ready",
    createdBy: "system",
    updatedBy: "system"
  });
  
  console.log("✅ Content item создан:", contentItem.id);
  console.log("   Статус: ready");
  
  console.log("\n✅ ===== ТЕСТОВЫЙ МАТЕРИАЛ СОЗДАН =====");
  console.log("📝 Backlog Item ID:", backlogItem.id);
  console.log("📄 Content Item ID:", contentItem.id);
  console.log("📋 Статус backlog: pending (в беклоге)");
  console.log("📋 Статус content: ready (готов к публикации)");
  console.log("\n💡 Теперь можно:");
  console.log("   1. Открыть SEO Agent → Content Plan");
  console.log("   2. Найти этот материал в Backlog Ideas");
  console.log("   3. Нажать 'Approve & Add to Queue'");
  console.log("   4. Выбрать дату (например, 9 декабря)");
  console.log("   5. Нажать 'Publish Now'");
  console.log("   6. Проверить, что пост опубликован с типом 'blog'");
  
  await mongoose.disconnect();
  console.log("\n📦 Отключено от MongoDB");
}

main();
