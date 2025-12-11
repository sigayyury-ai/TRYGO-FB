/**
 * Возвращает неправильно опубликованные статьи в беклог
 * Ищет статьи по названиям и возвращает их в статус PENDING
 */

import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

// Названия статей для возврата в беклог
const ARTICLE_TITLES = [
  "Трудности отсутствия опыта в маркетинге у основателей-одиночек и как их преодолеть",
  "Как увеличивать узнаваемость бренда при ограниченном бюджете",
  "Неделя 2: Решение проблем с ограниченным бюджетом на рекламу",
  "Почему отсутствие опыта в маркетинге — это не приговор для основателей-одиночек",
  "Проблема ограниченного бюджета на рекламу: решения для основателей-одиночек"
];

async function returnFakePublishedToBacklog() {
  console.log("=".repeat(80));
  console.log("ВОЗВРАТ НЕПРАВИЛЬНО ОПУБЛИКОВАННЫХ СТАТЕЙ В БЕКЛОГ");
  console.log("=".repeat(80));

  try {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI не установлен");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    let foundCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const title of ARTICLE_TITLES) {
      console.log(`\n🔍 Поиск статьи: "${title}"`);
      console.log("-".repeat(80));

      try {
        // Ищем backlog item по названию (case-insensitive, частичное совпадение)
        const backlogItem = await SeoBacklogIdea.findOne({
          title: { $regex: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
        }).exec();

        if (!backlogItem) {
          console.log(`⚠️  Backlog item не найден для: "${title}"`);
          continue;
        }

        foundCount++;
        console.log(`✅ Найден backlog item:`, {
          id: backlogItem.id,
          title: backlogItem.title,
          currentStatus: backlogItem.status,
          scheduledDate: backlogItem.scheduledDate
        });

        // Проверяем текущий статус
        if (backlogItem.status === "pending") {
          console.log(`ℹ️  Статус уже PENDING, пропускаем`);
          continue;
        }

        // Обновляем backlog item: статус PENDING, очищаем scheduledDate
        console.log(`📝 Обновление backlog item...`);
        backlogItem.status = "pending";
        backlogItem.scheduledDate = undefined;
        backlogItem.updatedBy = "system";
        await backlogItem.save();

        console.log(`✅ Backlog item обновлен:`, {
          newStatus: backlogItem.status,
          scheduledDate: backlogItem.scheduledDate
        });

        // Ищем связанный content item
        const contentItem = await SeoContentItem.findOne({
          backlogIdeaId: backlogItem.id
        }).exec();

        if (contentItem) {
          console.log(`✅ Найден content item:`, {
            id: contentItem.id,
            currentStatus: contentItem.status
          });

          // Обновляем content item: статус ready (если был published)
          if (contentItem.status === "published") {
            console.log(`📝 Обновление content item со статуса "published" на "ready"...`);
            contentItem.status = "ready";
            contentItem.updatedBy = "system";
            await contentItem.save();
            console.log(`✅ Content item обновлен: статус "ready"`);
          } else {
            console.log(`ℹ️  Content item уже имеет статус "${contentItem.status}", не обновляем`);
          }
        } else {
          console.log(`⚠️  Content item не найден для backlog item ${backlogItem.id}`);
        }

        updatedCount++;
        console.log(`✅ Статья "${title}" успешно возвращена в беклог`);

      } catch (error: any) {
        errorCount++;
        console.error(`❌ Ошибка при обработке "${title}":`, error.message);
        if (error.stack) {
          console.error(`Stack:`, error.stack);
        }
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("ИТОГИ");
    console.log("=".repeat(80));
    console.log(`Найдено статей: ${foundCount}`);
    console.log(`Обновлено статей: ${updatedCount}`);
    console.log(`Ошибок: ${errorCount}`);
    console.log("=".repeat(80));

    if (updatedCount > 0) {
      console.log("\n✅ Статьи успешно возвращены в беклог!");
      console.log("Теперь они должны появиться в разделе 'Backlog Ideas'");
    }

  } catch (error: any) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ КРИТИЧЕСКАЯ ОШИБКА");
    console.error("=".repeat(80));
    console.error("Сообщение:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
    console.error("=".repeat(80));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Отключено от MongoDB");
  }
}

// Запуск скрипта
returnFakePublishedToBacklog().catch(console.error);
