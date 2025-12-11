import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { mapBacklogIdea } from "../src/schema/resolvers.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

async function testDirectResolver() {
  try {
    console.log("🔍 Тестирование прямого вызова резолвера");
    console.log("=====================================\n");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const query: Record<string, unknown> = {
      projectId: testProjectId
    };
    
    if (testHypothesisId && testHypothesisId.trim() !== "") {
      query.hypothesisId = testHypothesisId;
    }

    console.log("Запрос:", JSON.stringify(query, null, 2));
    console.log();

    // Точный запрос из резолвера
    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .limit(10000)
      .exec();

    console.log(`✅ Найдено документов: ${docs.length}\n`);

    // Маппинг как в резолвере
    const mappedItems = docs.map(mapBacklogIdea);
    console.log(`✅ После маппинга: ${mappedItems.length}\n`);

    // Проверка статусов
    const statusCounts = mappedItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("📊 Распределение по статусам:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log();

    // Симуляция сериализации в JSON (как GraphQL делает)
    const jsonString = JSON.stringify(mappedItems);
    const jsonSize = jsonString.length;
    console.log(`📦 Размер JSON: ${(jsonSize / 1024).toFixed(2)} KB`);
    console.log(`   Количество элементов в JSON: ${mappedItems.length}`);

    // Проверка, что JSON валидный и можно распарсить обратно
    const parsed = JSON.parse(jsonString);
    console.log(`✅ После парсинга обратно: ${parsed.length} элементов`);
    console.log();

    // Проверка первых 5 элементов
    console.log("📋 Первые 5 элементов:");
    mappedItems.slice(0, 5).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.title.substring(0, 50)}... [${item.status}]`);
    });
    console.log();

    // Проверка последних 5 элементов
    console.log("📋 Последние 5 элементов:");
    mappedItems.slice(-5).forEach((item, i) => {
      const idx = mappedItems.length - 5 + i;
      console.log(`   ${idx + 1}. ${item.title.substring(0, 50)}... [${item.status}]`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Тест завершен");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testDirectResolver();

