import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoCluster } from "../src/db/models/SeoCluster.js";
import { WebsitePageIdea } from "../src/db/models/WebsitePageIdea.js";

async function listAllContentTables() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    console.log("=== ВСЕ КОЛЛЕКЦИИ ДЛЯ ХРАНЕНИЯ ИДЕЙ И КОНТЕНТА ===\n");

    // 1. SeoBacklogIdea - Идеи из беклога
    console.log("1. SEO BACKLOG IDEAS (seobacklogideas)");
    console.log("   Назначение: Хранит идеи для контента из беклога");
    console.log("   Поля:");
    console.log("     - projectId, hypothesisId");
    console.log("     - clusterId (опционально, связь с кластером)");
    console.log("     - title, description");
    console.log("     - category (pain, goal, trigger, feature, benefit, faq, info)");
    console.log("     - status (backlog, scheduled, archived, pending, in_progress, completed)");
    console.log("     - scheduledDate (опционально)");
    console.log("     - createdBy, updatedBy");
    const backlogCount = await SeoBacklogIdea.countDocuments();
    console.log(`   Записей в базе: ${backlogCount}\n`);

    // 2. SeoContentItem - Готовый сгенерированный контент
    console.log("2. SEO CONTENT ITEMS (seocontentitems)");
    console.log("   Назначение: Хранит готовый сгенерированный контент (статьи, коммерческие страницы)");
    console.log("   Поля:");
    console.log("     - projectId, hypothesisId");
    console.log("     - backlogIdeaId (опционально, связь с идеей из беклога)");
    console.log("     - title, category, format (blog, commercial, faq)");
    console.log("     - outline (структура статьи)");
    console.log("     - content (полный текст статьи в Markdown)");
    console.log("     - imageUrl (URL сгенерированного изображения)");
    console.log("     - status (draft, review, ready, published)");
    console.log("     - ownerId, reviewerId, channel");
    console.log("     - dueDate, createdBy, updatedBy");
    const contentCount = await SeoContentItem.countDocuments();
    console.log(`   Записей в базе: ${contentCount}\n`);

    // 3. SeoCluster - Кластеры ключевых слов
    console.log("3. SEO CLUSTERS (seoclusters)");
    console.log("   Назначение: Хранит кластеры ключевых слов для генерации идей");
    console.log("   Поля:");
    console.log("     - projectId, hypothesisId");
    console.log("     - title, intent (commercial, informational, navigational)");
    console.log("     - keywords (массив ключевых слов)");
    console.log("     - createdBy");
    const clusterCount = await SeoCluster.countDocuments();
    console.log(`   Записей в базе: ${clusterCount}\n`);

    // 4. WebsitePageIdea - Идеи для коммерческих страниц
    console.log("4. WEBSITE PAGE IDEAS (websitepageideas)");
    console.log("   Назначение: Хранит идеи для коммерческих страниц сайта");
    console.log("   Поля:");
    console.log("     - projectId, hypothesisId");
    console.log("     - title, description");
    console.log("     - sections (массив секций страницы)");
    console.log("     - status, createdBy");
    const websitePageCount = await WebsitePageIdea.countDocuments();
    console.log(`   Записей в базе: ${websitePageCount}\n`);

    // Проверяем все коллекции в базе
    console.log("\n=== ВСЕ КОЛЛЕКЦИИ В БАЗЕ ДАННЫХ ===");
    const collections = await db.listCollections().toArray();
    
    const contentRelatedCollections = collections.filter(c => 
      c.name.toLowerCase().includes("seo") ||
      c.name.toLowerCase().includes("content") ||
      c.name.toLowerCase().includes("backlog") ||
      c.name.toLowerCase().includes("cluster") ||
      c.name.toLowerCase().includes("idea") ||
      c.name.toLowerCase().includes("page")
    );

    console.log("\nКоллекции, связанные с контентом и идеями:");
    for (const col of contentRelatedCollections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} документов`);
    }

    console.log("\n=== СВЯЗИ МЕЖДУ КОЛЛЕКЦИЯМИ ===");
    console.log("SeoBacklogIdea -> SeoCluster (через clusterId)");
    console.log("SeoContentItem -> SeoBacklogIdea (через backlogIdeaId)");
    console.log("SeoContentItem -> SeoCluster (через backlogIdea.clusterId)");

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

listAllContentTables();

