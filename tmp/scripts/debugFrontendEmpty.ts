import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Отладка: почему фронтенд пустой
 */

async function debugFrontendEmpty() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    if (!project) {
      console.error("❌ Проект не найден");
      process.exit(1);
    }
    
    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });
    
    if (!hypothesis) {
      console.error("❌ Гипотеза не найдена");
      process.exit(1);
    }
    
    const projectId = project._id.toString();
    const hypothesisId = hypothesis._id.toString();
    
    console.log("=".repeat(70));
    console.log("🔍 ОТЛАДКА: ПОЧЕМУ ФРОНТЕНД ПУСТОЙ");
    console.log("=".repeat(70));
    console.log();
    console.log(`Project ID: ${projectId}`);
    console.log(`Hypothesis ID: ${hypothesisId}`);
    console.log();
    
    // Проверяем все идеи в БД
    console.log("1️⃣ ВСЕ ИДЕИ В БД (без фильтров):");
    console.log("-".repeat(70));
    const allIdeas = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId
    }).toArray();
    
    console.log(`Всего идей: ${allIdeas.length}`);
    allIdeas.forEach((idea, i) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   ID: ${idea._id.toString()}`);
      console.log(`   Category: ${idea.category}`);
      console.log(`   Status: ${idea.status || 'N/A'}`);
      console.log(`   Dismissed: ${idea.dismissed || false}`);
      console.log(`   Archived: ${idea.status === 'archived'}`);
    });
    console.log();
    
    // Проверяем с фильтрами как в resolver
    console.log("2️⃣ ИДЕИ С ФИЛЬТРАМИ (как в resolver):");
    console.log("-".repeat(70));
    const filteredIdeas = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      status: { $ne: "archived" }
    }).sort({ updatedAt: -1 }).toArray();
    
    console.log(`Идей после фильтрации: ${filteredIdeas.length}`);
    console.log();
    
    // Проверяем через GraphQL
    console.log("3️⃣ ПРОВЕРКА ЧЕРЕЗ GRAPHQL QUERY:");
    console.log("-".repeat(70));
    const { resolvers } = await import("../src/schema/resolvers.js");
    const userId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    
    const queryResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      { userId }
    );
    
    console.log(`Идей через query: ${queryResult.length}`);
    if (queryResult.length > 0) {
      console.log("\nПервые 3 идеи:");
      queryResult.slice(0, 3).forEach((idea: any, i: number) => {
        console.log(`\n${i + 1}. ${idea.title}`);
        console.log(`   ID: ${idea.id}`);
        console.log(`   Category: ${idea.category}`);
        console.log(`   Status: ${idea.status}`);
        console.log(`   Dismissed: ${idea.dismissed}`);
        console.log(`   ProjectId: ${idea.projectId}`);
        console.log(`   HypothesisId: ${idea.hypothesisId}`);
      });
    } else {
      console.error("❌ Query вернул 0 идей!");
    }
    console.log();
    
    // Проверяем возможные проблемы
    console.log("4️⃣ ПРОВЕРКА ВОЗМОЖНЫХ ПРОБЛЕМ:");
    console.log("-".repeat(70));
    
    // Проверка dismissed
    const dismissedCount = allIdeas.filter(i => i.dismissed === true).length;
    console.log(`Dismissed идей: ${dismissedCount}`);
    
    // Проверка archived
    const archivedCount = allIdeas.filter(i => i.status === 'archived').length;
    console.log(`Archived идей: ${archivedCount}`);
    
    // Проверка category
    const categoryCounts: Record<string, number> = {};
    allIdeas.forEach(idea => {
      const cat = idea.category || 'UNKNOWN';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    console.log("\nИдеи по категориям:");
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });
    
    // Проверка projectId/hypothesisId совпадения
    const wrongProject = allIdeas.filter(i => i.projectId !== projectId).length;
    const wrongHypothesis = allIdeas.filter(i => i.hypothesisId !== hypothesisId).length;
    console.log(`\nИдей с неправильным projectId: ${wrongProject}`);
    console.log(`Идей с неправильным hypothesisId: ${wrongHypothesis}`);
    
    console.log();
    console.log("=".repeat(70));
    console.log("💡 РЕКОМЕНДАЦИИ:");
    console.log("=".repeat(70));
    
    if (queryResult.length === 0) {
      console.log("❌ ПРОБЛЕМА: Query возвращает 0 идей");
      console.log("   Проверьте фильтры в resolver seoAgentContentIdeas");
    } else if (dismissedCount === allIdeas.length) {
      console.log("⚠️ ВСЕ ИДЕИ DISMISSED!");
      console.log("   Нужно проверить, не фильтруются ли они на фронтенде");
    } else {
      console.log("✅ Данные есть в query");
      console.log("   Проблема может быть на фронтенде:");
      console.log("   - Проверьте консоль браузера на ошибки");
      console.log("   - Проверьте, что hypothesisId передается правильно");
      console.log("   - Проверьте фильтрацию dismissed на фронтенде");
    }
    
    await mongoose.connection.close();
  } catch (error: any) {
    console.error("❌ Ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

debugFrontendEmpty();



