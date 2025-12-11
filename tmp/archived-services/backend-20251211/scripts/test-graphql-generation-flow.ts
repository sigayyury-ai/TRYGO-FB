/**
 * Тест GraphQL resolver для генерации идей
 * Проверяет полный флоу через resolver (как в реальном использовании)
 */

import mongoose from "mongoose";
import { resolvers } from "../src/schema/resolvers.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const PROJECT_ID = "686774b6773b5947fed60a78"; // AI marketing copilot
const HYPOTHESIS_ID = "687fe5363c4cca83a3cc578d"; // Solo founders
const USER_ID = "686773b5773b5947fed60a68"; // sigayyury5@gmail.com

async function testGraphQLResolver() {
  console.log("=".repeat(80));
  console.log("ТЕСТ GRAPHQL RESOLVER: generateContentIdeas");
  console.log("=".repeat(80));
  console.log(`Проект: ${PROJECT_ID}`);
  console.log(`Гипотеза: ${HYPOTHESIS_ID}`);
  console.log(`Пользователь: ${USER_ID}\n`);

  try {
    // Подключение к БД
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI не установлен");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // Мокируем контекст GraphQL
    const context = {
      userId: USER_ID,
      projectId: PROJECT_ID,
      hypothesisId: HYPOTHESIS_ID,
      token: "test-token"
    };

    // Вызываем resolver напрямую
    console.log("📋 Вызов GraphQL resolver: generateContentIdeas");
    console.log("-".repeat(80));
    
    const args = {
      projectId: PROJECT_ID,
      hypothesisId: HYPOTHESIS_ID,
      category: "PAINS" // Генерируем только для одной категории для теста
    };

    console.log("Аргументы:", args);
    console.log("");

    const result = await resolvers.Mutation.generateContentIdeas(
      null,
      args,
      context
    );

    console.log("✅ Результат генерации:");
    console.log(`   Сгенерировано идей: ${result.length}`);
    
    if (result.length > 0) {
      console.log("\n   Первые 3 идеи:");
      result.slice(0, 3).forEach((idea: any, index: number) => {
        console.log(`   ${index + 1}. ${idea.title}`);
        console.log(`      Категория: ${idea.category}`);
        console.log(`      Тип: ${idea.contentType}`);
        console.log(`      Статус: ${idea.status}`);
      });
    } else {
      console.log("   ⚠️  Идеи не были сгенерированы");
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ ТЕСТ RESOLVER ЗАВЕРШЕН УСПЕШНО");
    console.log("=".repeat(80));

  } catch (error: any) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ ОШИБКА В ТЕСТЕ RESOLVER");
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

testGraphQLResolver().catch(console.error);
