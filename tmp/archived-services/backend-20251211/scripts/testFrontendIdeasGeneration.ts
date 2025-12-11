import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

// Загружаем .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Автоматический тест генерации идей через фронтенд API
 * Симулирует реальный запрос от фронтенда
 */

async function testFrontendIdeasGeneration() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // Находим проект "AI marketing copilot"
    console.log("\n=== ПОИСК ПРОЕКТА ===");
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    
    if (!project) {
      console.error("❌ Проект 'AI marketing copilot' не найден!");
      await mongoose.connection.close();
      process.exit(1);
    }

    const projectId = project._id.toString();
    const userId = typeof project.userId === 'object' 
      ? project.userId.toString() 
      : project.userId;
    
    console.log(`✅ Проект: ${project.title}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   User ID: ${userId}`);

    // Находим гипотезу "Solo founders"
    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });

    if (!hypothesis) {
      console.error("❌ Гипотеза 'Solo founders' не найдена!");
      await mongoose.connection.close();
      process.exit(1);
    }

    const hypothesisId = hypothesis._id.toString();
    console.log(`✅ Гипотеза: ${hypothesis.title}`);
    console.log(`   Hypothesis ID: ${hypothesisId}`);

    // Проверяем текущее количество идей
    console.log("\n=== ПРОВЕРКА ТЕКУЩИХ ИДЕЙ ===");
    const existingIdeas = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      category: "pain",
      status: { $ne: "archived" }
    }).toArray();
    
    console.log(`Текущее количество идей PAINS: ${existingIdeas.length}`);

    // Тестируем через GraphQL resolver (как фронтенд)
    console.log("\n=== ТЕСТИРОВАНИЕ ГЕНЕРАЦИИ ИДЕЙ ===");
    const { resolvers } = await import("../src/schema/resolvers.js");
    
    const mockContext = {
      userId: userId,
      projectId: projectId,
      hypothesisId: hypothesisId,
      token: "mock-token-for-testing"
    };

    console.log("Вызываю generateContentIdeas mutation...");
    const startTime = Date.now();
    
    const result = await resolvers.Mutation.generateContentIdeas(
      null,
      {
        projectId: projectId,
        hypothesisId: hypothesisId,
        category: "PAINS"
      },
      mockContext
    );

    const duration = Date.now() - startTime;

    console.log(`\n✅ Генерация завершена за ${duration}ms`);
    console.log(`✅ Сгенерировано новых идей: ${result.length}`);

    // Проверяем, что идеи сохранились в БД
    console.log("\n=== ПРОВЕРКА СОХРАНЕНИЯ В БД ===");
    const newIdeas = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      category: "pain",
      status: { $ne: "archived" }
    }).sort({ createdAt: -1 }).limit(result.length).toArray();

    console.log(`✅ Найдено идей в БД: ${newIdeas.length}`);

    // Проверяем через GraphQL query (как фронтенд загружает)
    console.log("\n=== ТЕСТИРОВАНИЕ ЗАГРУЗКИ ИДЕЙ ===");
    const queryResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      mockContext
    );

    const painsIdeas = queryResult.filter((idea: any) => idea.category === "PAINS");
    console.log(`✅ Загружено идей PAINS через query: ${painsIdeas.length}`);

    // Выводим результаты
    console.log("\n=== РЕЗУЛЬТАТЫ ГЕНЕРАЦИИ ===");
    result.slice(0, 5).forEach((idea: any, i: number) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   Описание: ${idea.description || "Нет описания"}`);
      console.log(`   Категория: ${idea.category}`);
      console.log(`   ID: ${idea.id}`);
    });

    // Итоговый отчет
    console.log("\n=== ✅ ИТОГОВЫЙ ОТЧЕТ ===");
    console.log(`📊 Статус:`);
    console.log(`   ✅ Проект: ${project.title} (${projectId})`);
    console.log(`   ✅ Гипотеза: ${hypothesis.title} (${hypothesisId})`);
    console.log(`   ✅ Сгенерировано новых: ${result.length}`);
    console.log(`   ✅ Сохранено в БД: ${newIdeas.length}`);
    console.log(`   ✅ Доступно через query: ${painsIdeas.length}`);
    console.log(`   ✅ Время генерации: ${duration}ms`);

    if (result.length > 0 && newIdeas.length > 0 && painsIdeas.length > 0) {
      console.log(`\n🎉 ТЕСТ ПРОЙДЕН УСПЕШНО!`);
      console.log(`\n📋 Идеи готовы для отображения на фронтенде!`);
      console.log(`   Откройте http://localhost:8080/seo-agent#content`);
      console.log(`   Выберите проект '${project.title}' и гипотезу '${hypothesis.title}'`);
      console.log(`   Идеи должны отобразиться автоматически!`);
    } else {
      console.error(`\n❌ ТЕСТ НЕ ПРОЙДЕН: проблемы с генерацией или сохранением`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error("\n❌ Тест завершен с ошибкой:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Соединение с MongoDB закрыто");
  }
}

testFrontendIdeasGeneration();


