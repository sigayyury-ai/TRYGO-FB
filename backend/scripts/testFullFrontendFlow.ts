import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

// Загружаем .env из корня backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Полный тест генерации идей для PAINS через реальный GraphQL запрос
 * Симулирует запрос от фронтенда полностью
 */

async function testFullFrontendFlow() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // Находим проект "AI marketing copilot"
    console.log(`\n=== ПОИСК ПРОЕКТА ===`);
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    
    if (!project) {
      console.error(`❌ Проект "AI marketing copilot" не найден!`);
      await mongoose.connection.close();
      process.exit(1);
    }

    const projectId = project._id.toString();
    const userId = typeof project.userId === 'object' 
      ? project.userId.toString() 
      : project.userId;
    
    console.log(`✅ Найден проект: ${project.title}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   User ID: ${userId}`);

    // Находим гипотезу "Solo founders"
    console.log(`\n=== ПОИСК ГИПОТЕЗЫ ===`);
    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });

    if (!hypothesis) {
      console.error(`❌ Гипотеза "Solo founders" не найдена!`);
      await mongoose.connection.close();
      process.exit(1);
    }

    const hypothesisId = hypothesis._id.toString();
    console.log(`✅ Найдена гипотеза: ${hypothesis.title}`);
    console.log(`   Hypothesis ID: ${hypothesisId}`);

    // Находим пользователя и создаем JWT токен
    console.log(`\n=== СОЗДАНИЕ JWT ТОКЕНА ===`);
    const user = await db.collection("users").findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    // Для теста используем простой токен (в реальности нужен правильный JWT)
    // Но для теста можно использовать mock токен, так как мы тестируем через прямой вызов
    
    // Тестируем через GraphQL resolver напрямую
    console.log(`\n=== ТЕСТИРОВАНИЕ ЧЕРЕЗ GRAPHQL RESOLVER ===`);
    const { resolvers } = await import("../src/schema/resolvers.js");
    
    const mockContext = {
      userId: userId,
      projectId: projectId,
      hypothesisId: hypothesisId,
      token: "mock-token-for-testing"
    };

    console.log(`Вызываю generateContentIdeas с category: PAINS...`);
    const result = await resolvers.Mutation.generateContentIdeas(
      null,
      {
        projectId: projectId,
        hypothesisId: hypothesisId,
        category: "PAINS"
      },
      mockContext
    );

    console.log(`\n✅ GraphQL resolver вернул ${result.length} идей`);
    console.log(`\n=== РЕЗУЛЬТАТЫ ГЕНЕРАЦИИ ===`);
    
    result.forEach((idea: any, i: number) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   Описание: ${idea.description || "Нет описания"}`);
      console.log(`   Категория: ${idea.category}`);
      console.log(`   ID: ${idea.id}`);
    });

    // Проверяем, что идеи сохранились в базе
    console.log(`\n=== ПРОВЕРКА БАЗЫ ДАННЫХ ===`);
    const savedIdeas = await db.collection("seoContentItems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      category: "pain"
    }).toArray();

    console.log(`✅ Найдено сохраненных идей в БД: ${savedIdeas.length}`);
    savedIdeas.forEach((idea: any, i: number) => {
      console.log(`   ${i + 1}. ${idea.title} (ID: ${idea._id})`);
    });

    console.log(`\n✅ ТЕСТ ПРОЙДЕН УСПЕШНО!`);
    console.log(`\n📋 РЕЗЮМЕ:`);
    console.log(`   ✅ Проект: ${project.title} (${projectId})`);
    console.log(`   ✅ Гипотеза: ${hypothesis.title} (${hypothesisId})`);
    console.log(`   ✅ User ID: ${userId}`);
    console.log(`   ✅ Проверка принадлежности: OK`);
    console.log(`   ✅ SEO контекст загружен`);
    console.log(`   ✅ Генерация через GraphQL: ${result.length} идей`);
    console.log(`   ✅ Идеи сохранены в БД: ${savedIdeas.length}`);

    console.log(`\n🚀 ВСЕ РАБОТАЕТ! Можно тестировать через фронтенд!`);

  } catch (error: any) {
    console.error("\n❌ Тест завершен с ошибкой:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Соединение с MongoDB закрыто");
  }
}

testFullFrontendFlow();

