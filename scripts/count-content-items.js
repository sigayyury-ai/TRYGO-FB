#!/usr/bin/env node

/**
 * Скрипт для подсчета единиц контента для проекта
 * Использование: node scripts/count-content-items.js <projectId>
 */

import mongoose from "mongoose";
import { SeoContentItem } from "../backend/src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

// Загружаем переменные окружения
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI не установлен в .env");
  process.exit(1);
}

const projectId = process.argv[2];

if (!projectId) {
  console.error("❌ Укажите projectId как аргумент");
  console.log("Использование: node scripts/count-content-items.js <projectId>");
  process.exit(1);
}

async function countContentItems() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // Подсчитываем общее количество
    const totalCount = await SeoContentItem.countDocuments({ projectId });
    
    // Подсчитываем по категориям
    const byCategory = await SeoContentItem.aggregate([
      { $match: { projectId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Подсчитываем по статусам
    const byStatus = await SeoContentItem.aggregate([
      { $match: { projectId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Подсчитываем по форматам
    const byFormat = await SeoContentItem.aggregate([
      { $match: { projectId } },
      { $group: { _id: "$format", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Подсчитываем по гипотезам
    const byHypothesis = await SeoContentItem.aggregate([
      { $match: { projectId } },
      { $group: { _id: "$hypothesisId", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Подсчитываем опубликованные
    const publishedCount = await SeoContentItem.countDocuments({ 
      projectId, 
      status: "published" 
    });

    // Подсчитываем в работе (draft, review, ready)
    const inProgressCount = await SeoContentItem.countDocuments({ 
      projectId, 
      status: { $in: ["draft", "review", "ready"] } 
    });

    // Выводим результаты
    console.log("📊 Статистика контента для проекта:", projectId);
    console.log("=" .repeat(60));
    console.log(`\n📝 Всего единиц контента: ${totalCount}`);
    console.log(`   ✅ Опубликовано: ${publishedCount}`);
    console.log(`   🔄 В работе: ${inProgressCount}`);
    console.log(`   📦 Архив: ${await SeoContentItem.countDocuments({ projectId, status: "archived" })}`);

    if (byCategory.length > 0) {
      console.log("\n📂 По категориям:");
      byCategory.forEach(({ _id, count }) => {
        const categoryLabel = {
          pain: "PAIN (Боли)",
          goal: "GOAL (Цели)",
          trigger: "TRIGGER (Триггеры)",
          feature: "FEATURE (Фичи)",
          benefit: "BENEFIT (Преимущества)",
          faq: "FAQ",
          info: "INFO (Информационные)"
        }[_id] || _id;
        console.log(`   ${categoryLabel.padEnd(30)} ${count}`);
      });
    }

    if (byStatus.length > 0) {
      console.log("\n📋 По статусам:");
      byStatus.forEach(({ _id, count }) => {
        const statusLabel = {
          draft: "Черновик",
          review: "На проверке",
          ready: "Готово",
          published: "Опубликовано",
          archived: "Архив"
        }[_id] || _id;
        console.log(`   ${statusLabel.padEnd(30)} ${count}`);
      });
    }

    if (byFormat.length > 0) {
      console.log("\n📄 По форматам:");
      byFormat.forEach(({ _id, count }) => {
        const formatLabel = {
          blog: "Блог-статьи",
          commercial: "Коммерческие страницы",
          faq: "FAQ статьи"
        }[_id] || _id;
        console.log(`   ${formatLabel.padEnd(30)} ${count}`);
      });
    }

    if (byHypothesis.length > 0) {
      console.log("\n🎯 По гипотезам:");
      byHypothesis.forEach(({ _id, count }) => {
        console.log(`   ${_id.padEnd(30)} ${count}`);
      });
    }

    // Последние созданные
    const recent = await SeoContentItem.find({ projectId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title category status createdAt")
      .lean();

    if (recent.length > 0) {
      console.log("\n🕐 Последние 5 созданных:");
      recent.forEach((item, index) => {
        const date = new Date(item.createdAt).toLocaleDateString("ru-RU");
        console.log(`   ${index + 1}. [${item.category}] ${item.title.substring(0, 50)}${item.title.length > 50 ? "..." : ""} (${item.status}, ${date})`);
      });
    }

    console.log("\n" + "=".repeat(60));

  } catch (error) {
    console.error("❌ Ошибка:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Отключено от MongoDB");
  }
}

countContentItems();






