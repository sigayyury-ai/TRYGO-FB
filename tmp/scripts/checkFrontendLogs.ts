import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Скрипт для проверки того, что видит фронтенд
 * Симулирует реальный запрос от фронтенда и показывает логи
 */

async function checkFrontendLogs() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB\n");

    const db = mongoose.connection.db;
    
    // Находим проект "AI marketing copilot"
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    if (!project) {
      console.error("❌ Проект 'AI marketing copilot' не найден!");
      process.exit(1);
    }

    const projectId = project._id.toString();
    const userId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    
    // Находим гипотезу "Solo founders"
    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });

    if (!hypothesis) {
      console.error("❌ Гипотеза 'Solo founders' не найдена!");
      process.exit(1);
    }

    const hypothesisId = hypothesis._id.toString();
    
    console.log("=".repeat(60));
    console.log("📋 ПАРАМЕТРЫ ЗАПРОСА (как фронтенд отправляет)");
    console.log("=".repeat(60));
    console.log(`Project ID: ${projectId}`);
    console.log(`Hypothesis ID: ${hypothesisId}`);
    console.log(`User ID: ${userId}`);
    console.log(`Project Title: ${project.title}`);
    console.log(`Hypothesis Title: ${hypothesis.title}`);
    console.log();

    // Симулируем запрос фронтенда через GraphQL resolver
    console.log("=".repeat(60));
    console.log("🔍 СИМУЛЯЦИЯ ЗАПРОСА ОТ ФРОНТЕНДА");
    console.log("=".repeat(60));
    console.log("[SeoContentPanel] 📥 Loading content ideas:", {
      projectId,
      hypothesisId: hypothesisId || "NOT PROVIDED"
    });
    console.log();

    const { resolvers } = await import("../src/schema/resolvers.js");
    const mockContext = {
      userId: userId
    };

    // Вызываем query как фронтенд
    const queryResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      mockContext
    );

    const ideas = queryResult || [];
    const painsIdeas = ideas.filter((idea: any) => idea.category === "PAINS");

    console.log(`[SeoContentPanel] ✅ Loaded ideas: ${ideas.length}`);
    
    if (ideas.length > 0) {
      console.log(`[SeoContentPanel] Sample ideas:`, 
        ideas.slice(0, 3).map((i: any) => i.title)
      );
    } else {
      console.log(`[SeoContentPanel] ⚠️ No ideas returned from API`);
    }
    console.log();

    // Детальная информация
    console.log("=".repeat(60));
    console.log("📊 ДЕТАЛЬНАЯ ИНФОРМАЦИЯ");
    console.log("=".repeat(60));
    console.log(`Всего идей: ${ideas.length}`);
    console.log(`Идей PAINS: ${painsIdeas.length}`);
    console.log();

    if (painsIdeas.length > 0) {
      console.log("Первые 5 идей PAINS:");
      painsIdeas.slice(0, 5).forEach((idea: any, i: number) => {
        console.log(`\n${i + 1}. ${idea.title}`);
        console.log(`   ID: ${idea.id}`);
        console.log(`   Category: ${idea.category}`);
        console.log(`   Dismissed: ${idea.dismissed || false}`);
        console.log(`   Status: ${idea.status || 'NEW'}`);
      });
    }

    console.log();
    console.log("=".repeat(60));
    console.log("✅ РЕЗУЛЬТАТ ПРОВЕРКИ");
    console.log("=".repeat(60));
    
    if (ideas.length > 0) {
      console.log("✅ Идеи доступны для фронтенда!");
      console.log(`✅ Фронтенд должен увидеть ${ideas.length} идей`);
      console.log(`✅ Из них ${painsIdeas.length} идей в категории PAINS`);
      console.log();
      console.log("💡 ЧТО ДОЛЖНО БЫТЬ В КОНСОЛИ БРАУЗЕРА:");
      console.log(`   [SeoContentPanel] 📥 Loading content ideas: {projectId: '${projectId}', hypothesisId: '${hypothesisId}'}`);
      console.log(`   [SeoContentPanel] ✅ Loaded ideas: ${ideas.length}`);
      console.log(`   [SeoContentPanel] Sample ideas: [${ideas.slice(0, 3).map((i: any) => `'${i.title}'`).join(', ')}]`);
    } else {
      console.log("❌ Идеи не найдены!");
      console.log("   Проверьте, что данные сохранены в БД");
    }

    await mongoose.connection.close();
  } catch (error: any) {
    console.error("\n❌ Ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

checkFrontendLogs();



