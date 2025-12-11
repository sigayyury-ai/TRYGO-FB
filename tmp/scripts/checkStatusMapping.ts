import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

// Функция маппинга статусов из резолвера
const toUpperEnum = (value: string) => value.toUpperCase();
const mapBacklogStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    backlog: "PENDING",
    scheduled: "SCHEDULED",
    archived: "ARCHIVED"
  };
  return statusMap[status.toLowerCase()] || toUpperEnum(status);
};

async function checkStatusMapping() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const query: Record<string, unknown> = {
      projectId: testProjectId
    };
    
    if (testHypothesisId && testHypothesisId.trim() !== "") {
      query.hypothesisId = testHypothesisId;
    }

    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .limit(10000)
      .exec();

    console.log(`📊 Всего элементов: ${docs.length}\n`);

    // Анализ статусов ДО маппинга
    console.log("📊 СТАТУСЫ ДО МАППИНГА (из БД):");
    const statusCountsBefore = docs.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(statusCountsBefore).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log();

    // Маппинг
    const mappedItems = docs.map(doc => ({
      id: doc._id.toString(),
      title: doc.title,
      originalStatus: doc.status,
      mappedStatus: mapBacklogStatus(doc.status)
    }));

    // Анализ статусов ПОСЛЕ маппинга
    console.log("📊 СТАТУСЫ ПОСЛЕ МАППИНГА (для GraphQL):");
    const statusCountsAfter = mappedItems.reduce((acc, item) => {
      acc[item.mappedStatus] = (acc[item.mappedStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(statusCountsAfter).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log();

    // Элементы, которые будут PENDING (показываются на фронтенде)
    const pendingItems = mappedItems.filter(item => item.mappedStatus === "PENDING");
    console.log(`✅ Элементов со статусом PENDING (показываются на фронтенде): ${pendingItems.length}`);
    console.log();

    // Примеры элементов по статусам
    console.log("📋 ПРИМЕРЫ ЭЛЕМЕНТОВ ПО СТАТУСАМ:\n");
    
    Object.entries(statusCountsAfter).forEach(([mappedStatus, count]) => {
      const examples = mappedItems
        .filter(item => item.mappedStatus === mappedStatus)
        .slice(0, 3);
      
      console.log(`${mappedStatus} (${count} элементов):`);
      examples.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title.substring(0, 60)}...`);
        console.log(`      Оригинальный статус: ${item.originalStatus}`);
        console.log(`      Маппированный статус: ${item.mappedStatus}`);
      });
      console.log();
    });

    // Проверка: сколько элементов НЕ будут PENDING
    const nonPendingItems = mappedItems.filter(item => item.mappedStatus !== "PENDING");
    console.log(`❌ Элементов с другими статусами (НЕ показываются на фронтенде): ${nonPendingItems.length}`);
    if (nonPendingItems.length > 0) {
      console.log("\nПримеры элементов, которые НЕ показываются:");
      nonPendingItems.slice(0, 5).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.title.substring(0, 60)}...`);
        console.log(`      Статус: ${item.originalStatus} → ${item.mappedStatus}`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Анализ завершен");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkStatusMapping();

