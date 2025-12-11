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

async function debugQueryComparison() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // Тест 1: Запрос БЕЗ hypothesisId (как в резолвере, если hypothesisId не передан)
    console.log("🔍 ТЕСТ 1: Запрос БЕЗ hypothesisId");
    console.log("-----------------------------------");
    const query1: Record<string, unknown> = {
      projectId: testProjectId
    };
    const count1 = await SeoBacklogIdea.countDocuments(query1);
    const docs1 = await SeoBacklogIdea.find(query1).limit(10000).exec();
    console.log(`   Запрос:`, JSON.stringify(query1, null, 2));
    console.log(`   countDocuments(): ${count1}`);
    console.log(`   find(): ${docs1.length}`);
    console.log();

    // Тест 2: Запрос С hypothesisId (как в резолвере, если hypothesisId передан)
    console.log("🔍 ТЕСТ 2: Запрос С hypothesisId");
    console.log("-----------------------------------");
    const query2: Record<string, unknown> = {
      projectId: testProjectId
    };
    
    if (testHypothesisId && testHypothesisId.trim() !== "") {
      query2.hypothesisId = testHypothesisId;
    }
    
    const count2 = await SeoBacklogIdea.countDocuments(query2);
    const docs2 = await SeoBacklogIdea.find(query2).limit(10000).exec();
    console.log(`   Запрос:`, JSON.stringify(query2, null, 2));
    console.log(`   countDocuments(): ${count2}`);
    console.log(`   find(): ${docs2.length}`);
    console.log();

    // Тест 3: Проверка типов данных
    console.log("🔍 ТЕСТ 3: Проверка типов данных в БД");
    console.log("-----------------------------------");
    const sampleDoc = await SeoBacklogIdea.findOne({ projectId: testProjectId });
    if (sampleDoc) {
      console.log(`   Тип projectId в БД: ${typeof sampleDoc.projectId}`);
      console.log(`   Значение projectId: ${sampleDoc.projectId}`);
      console.log(`   Тип hypothesisId в БД: ${typeof sampleDoc.hypothesisId}`);
      console.log(`   Значение hypothesisId: ${sampleDoc.hypothesisId}`);
      console.log(`   Сравнение projectId: ${sampleDoc.projectId === testProjectId}`);
      console.log(`   Сравнение hypothesisId: ${sampleDoc.hypothesisId === testHypothesisId}`);
    }
    console.log();

    // Тест 4: Проверка всех уникальных значений
    console.log("🔍 ТЕСТ 4: Уникальные значения в БД");
    console.log("-----------------------------------");
    const allDocs = await SeoBacklogIdea.find({ projectId: testProjectId }).limit(10000).exec();
    const uniqueProjectIds = new Set(allDocs.map(d => d.projectId));
    const uniqueHypothesisIds = new Set(allDocs.map(d => d.hypothesisId));
    console.log(`   Уникальных projectId: ${uniqueProjectIds.size}`);
    console.log(`   Уникальных hypothesisId: ${uniqueHypothesisIds.size}`);
    console.log(`   Все projectId:`, Array.from(uniqueProjectIds));
    console.log(`   Все hypothesisId:`, Array.from(uniqueHypothesisIds));
    console.log();

    // Тест 5: Проверка с разными вариантами запроса
    console.log("🔍 ТЕСТ 5: Разные варианты запроса");
    console.log("-----------------------------------");
    
    // Вариант A: Строковое сравнение
    const queryA = { projectId: testProjectId, hypothesisId: testHypothesisId };
    const countA = await SeoBacklogIdea.countDocuments(queryA);
    console.log(`   A. Строковое сравнение: ${countA}`);
    
    // Вариант B: Регулярное выражение
    const queryB = { 
      projectId: new RegExp(`^${testProjectId}$`), 
      hypothesisId: new RegExp(`^${testHypothesisId}$`)
    };
    const countB = await SeoBacklogIdea.countDocuments(queryB);
    console.log(`   B. Регулярное выражение: ${countB}`);
    
    // Вариант C: ObjectId (если это ObjectId)
    try {
      const queryC = { 
        projectId: new mongoose.Types.ObjectId(testProjectId),
        hypothesisId: new mongoose.Types.ObjectId(testHypothesisId)
      };
      const countC = await SeoBacklogIdea.countDocuments(queryC);
      console.log(`   C. ObjectId: ${countC}`);
    } catch (e) {
      console.log(`   C. ObjectId: Ошибка (не ObjectId)`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Тест завершен");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugQueryComparison();

