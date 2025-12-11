#!/usr/bin/env tsx

/**
 * Скрипт для подсчета единиц контента для проекта и гипотезы
 * Использование: tsx backend/scripts/count-content-for-hypothesis.ts <projectId> <hypothesisId>
 */

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

// Загружаем переменные окружения
config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI не установлен в .env");
  process.exit(1);
}

const projectId = process.argv[2];
const hypothesisId = process.argv[3];

if (!projectId || !hypothesisId) {
  console.error("❌ Укажите projectId и hypothesisId как аргументы");
  console.log("Использование: tsx backend/scripts/count-content-for-hypothesis.ts <projectId> <hypothesisId>");
  process.exit(1);
}

async function countContentItems() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const query = { projectId, hypothesisId };

    // Подсчитываем общее количество
    const totalCount = await SeoContentItem.countDocuments(query);
    
    // Подсчитываем по категориям
    const byCategory = await SeoContentItem.aggregate([
      { $match: query },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Подсчитываем по статусам
    const byStatus = await SeoContentItem.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Подсчитываем по форматам
    const byFormat = await SeoContentItem.aggregate([
      { $match: query },
      { $group: { _id: "$format", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Подсчитываем опубликованные
    const publishedCount = await SeoContentItem.countDocuments({ 
      ...query,
      status: "published" 
    });

    // Подсчитываем в работе (draft, review, ready)
    const inProgressCount = await SeoContentItem.countDocuments({ 
      ...query,
      status: { $in: ["draft", "review", "ready"] } 
    });

    // Выводим результаты
    console.log("📊 Статистика контента");
    console.log("=".repeat(60));
    console.log(`Проект ID: ${projectId}`);
    console.log(`Гипотеза ID: ${hypothesisId}`);
    console.log("=".repeat(60));
    console.log(`\n📝 Всего единиц контента: ${totalCount}`);
    console.log(`   ✅ Опубликовано: ${publishedCount}`);
    console.log(`   🔄 В работе: ${inProgressCount}`);
    console.log(`   📦 Архив: ${await SeoContentItem.countDocuments({ ...query, status: "archived" })}`);

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

    // Последние созданные
    const recent = await SeoContentItem.find(query)
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





