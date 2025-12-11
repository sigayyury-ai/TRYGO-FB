#!/usr/bin/env node

/**
 * Скрипт для показа всех проектов и подсчета контента
 */

const mongoose = require("mongoose");
const { config } = require("dotenv");
const { resolve } = require("path");
const path = require("path");

// Используем прямой путь к скомпилированному JS файлу или TypeScript через ts-node
const backendPath = path.resolve(__dirname, "../backend");
const modelPath = path.resolve(backendPath, "src/db/models/SeoContentItem.js");

// Если файл .js не существует, попробуем .ts
let SeoContentItem;
try {
  SeoContentItem = require(modelPath).SeoContentItem;
} catch (e) {
  // Попробуем .ts
  const tsModelPath = path.resolve(backendPath, "src/db/models/SeoContentItem.ts");
  try {
    // Используем tsx или ts-node если доступен
    SeoContentItem = require(tsModelPath).SeoContentItem;
  } catch (e2) {
    // Если не получается, создадим модель напрямую
    const Schema = mongoose.Schema;
    const SeoContentItemSchema = new Schema({
      projectId: { type: String, required: true, index: true },
      hypothesisId: { type: String, required: true, index: true },
      title: { type: String, required: true },
      category: { type: String, required: true },
      format: { type: String, required: true },
      status: { type: String, default: "draft", index: true }
    }, { timestamps: true, collection: "seocontentitems" });
    SeoContentItem = mongoose.model("SeoContentItem", SeoContentItemSchema);
  }
}

// Пробуем загрузить .env из разных мест
config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../backend/.env") });
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../backend/.env.local") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI не установлен в .env");
  process.exit(1);
}

async function listProjectsAndCount() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const db = mongoose.connection.db;
    
    // Получаем все проекты
    const projects = await db.collection("projects").find({}).toArray();
    
    if (projects.length === 0) {
      console.log("❌ Проекты не найдены");
      return;
    }

    console.log(`📊 Найдено проектов: ${projects.length}\n`);
    console.log("=".repeat(80));

    // Для каждого проекта считаем контент
    for (const project of projects) {
      const projectId = project._id.toString();
      const projectTitle = project.title || "Без названия";
      
      const totalCount = await SeoContentItem.countDocuments({ projectId });
      const publishedCount = await SeoContentItem.countDocuments({ 
        projectId, 
        status: "published" 
      });
      const inProgressCount = await SeoContentItem.countDocuments({ 
        projectId, 
        status: { $in: ["draft", "review", "ready"] } 
      });

      // Подсчет по категориям
      const byCategory = await SeoContentItem.aggregate([
        { $match: { projectId } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      console.log(`\n📁 Проект: ${projectTitle}`);
      console.log(`   ID: ${projectId}`);
      console.log(`   📝 Всего контента: ${totalCount}`);
      console.log(`   ✅ Опубликовано: ${publishedCount}`);
      console.log(`   🔄 В работе: ${inProgressCount}`);

      if (byCategory.length > 0) {
        console.log(`   📂 По категориям:`);
        byCategory.forEach(({ _id, count }) => {
          const categoryLabel = {
            pain: "PAIN",
            goal: "GOAL",
            trigger: "TRIGGER",
            feature: "FEATURE",
            benefit: "BENEFIT",
            faq: "FAQ",
            info: "INFO"
          }[_id] || _id;
          console.log(`      ${categoryLabel.padEnd(10)} ${count}`);
        });
      }

      console.log("-".repeat(80));
    }

    // Общая статистика
    const totalAllProjects = await SeoContentItem.countDocuments({});
    const totalPublished = await SeoContentItem.countDocuments({ status: "published" });
    
    console.log(`\n📊 ОБЩАЯ СТАТИСТИКА ПО ВСЕМ ПРОЕКТАМ:`);
    console.log(`   📝 Всего единиц контента: ${totalAllProjects}`);
    console.log(`   ✅ Опубликовано: ${totalPublished}`);
    console.log(`   🔄 В работе: ${await SeoContentItem.countDocuments({ status: { $in: ["draft", "review", "ready"] } })}`);

  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Отключено от MongoDB");
  }
}

listProjectsAndCount();
