import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Загружаем .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Полный тест всего flow: БД -> API -> Проверка данных
 */

async function testFullFlow() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // 1. Находим правильный проект и гипотезу
    console.log("\n=== ШАГ 1: Поиск проекта и гипотезы ===");
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    
    if (!project) {
      console.error("❌ Проект 'AI marketing copilot' не найден!");
      process.exit(1);
    }

    const projectId = project._id.toString();
    const userId = typeof project.userId === 'object' 
      ? project.userId.toString() 
      : project.userId;
    
    console.log(`✅ Проект: ${project.title}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   User ID: ${userId}`);

    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });

    if (!hypothesis) {
      console.error("❌ Гипотеза 'Solo founders' не найдена!");
      process.exit(1);
    }

    const hypothesisId = hypothesis._id.toString();
    console.log(`✅ Гипотеза: ${hypothesis.title}`);
    console.log(`   Hypothesis ID: ${hypothesisId}`);

    // 2. Проверяем идеи в БД
    console.log("\n=== ШАГ 2: Проверка идей в БД ===");
    const ideas = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      status: { $ne: "archived" }
    }).sort({ createdAt: -1 }).toArray();

    console.log(`✅ Найдено идей в БД: ${ideas.length}`);
    if (ideas.length === 0) {
      console.log("⚠️  Идей нет! Нужно сгенерировать.");
      console.log("\n=== ГЕНЕРАЦИЯ ИДЕЙ ===");
      const { resolvers } = await import("../src/schema/resolvers.js");
      const mockContext = {
        userId: userId,
        projectId: projectId,
        hypothesisId: hypothesisId,
        token: "mock-token"
      };
      const result = await resolvers.Mutation.generateContentIdeas(
        null,
        { projectId, hypothesisId, category: "PAINS" },
        mockContext
      );
      console.log(`✅ Сгенерировано: ${result.length} идей`);
    } else {
      console.log("\n📋 Примеры идей из БД:");
      ideas.slice(0, 5).forEach((idea, i) => {
        console.log(`   ${i + 1}. ${idea.title}`);
      });
    }

    // 3. Тестируем GraphQL API
    console.log("\n=== ШАГ 3: Тест GraphQL API ===");
    const { resolvers } = await import("../src/schema/resolvers.js");
    const mockContext = {
      userId: userId,
      projectId: projectId,
      hypothesisId: hypothesisId,
      token: "mock-token"
    };

    const apiResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      mockContext
    );

    console.log(`✅ API вернул: ${apiResult.length} идей`);
    if (apiResult.length > 0) {
      console.log("\n📋 Примеры идей из API:");
      apiResult.slice(0, 5).forEach((idea: any, i: number) => {
        console.log(`   ${i + 1}. ${idea.title}`);
      });
    }

    // 4. Итоговый отчет
    console.log("\n=== ✅ ИТОГОВЫЙ ОТЧЕТ ===");
    console.log(`📊 Статус:`);
    console.log(`   ✅ Проект найден: ${project.title} (${projectId})`);
    console.log(`   ✅ Гипотеза найдена: ${hypothesis.title} (${hypothesisId})`);
    console.log(`   ✅ Идей в БД: ${ideas.length}`);
    console.log(`   ✅ Идей через API: ${apiResult.length}`);
    
    if (apiResult.length > 0) {
      console.log(`\n🎉 ВСЕ РАБОТАЕТ! Идеи готовы для отображения на фронте!`);
      console.log(`\n📋 ИНСТРУКЦИЯ ДЛЯ ФРОНТЕНДА:`);
      console.log(`   1. Откройте http://localhost:8080/seo-agent#content`);
      console.log(`   2. Убедитесь, что выбраны:`);
      console.log(`      - Проект: ${project.title}`);
      console.log(`      - Гипотеза: ${hypothesis.title}`);
      console.log(`   3. Идеи должны отобразиться автоматически`);
    } else {
      console.log(`\n⚠️  Идеи не найдены через API, но есть в БД. Проверьте resolver.`);
    }

  } catch (error: any) {
    console.error("\n❌ Ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

testFullFlow();

