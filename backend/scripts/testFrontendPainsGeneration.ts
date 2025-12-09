import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Загружаем .env из корня backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Полный тест генерации идей для PAINS через фронтенд API
 * Симулирует запрос от фронтенда
 */

async function testFrontendPainsGeneration() {
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

    // Проверяем SEO контекст
    console.log(`\n=== ПРОВЕРКА SEO КОНТЕКСТА ===`);
    const { loadSeoContext } = await import("../src/services/context/seoContext.js");
    const seoContext = await loadSeoContext(projectId, hypothesisId, userId);
    
    console.log(`✅ SEO контекст загружен:`);
    console.log(`   Проект: ${seoContext.project?.title || "NOT FOUND"}`);
    console.log(`   Гипотеза: ${seoContext.hypothesis?.title || "NOT FOUND"}`);
    console.log(`   Язык: ${seoContext.language || "Russian (default)"}`);
    console.log(`   ICP: ${seoContext.icp ? "Найден" : "Не найден"}`);
    console.log(`   Lean Canvas: ${seoContext.leanCanvas ? "Найден" : "Не найден"}`);
    console.log(`   Clusters: ${seoContext.clusters.length}`);

    // Проверяем ICP данные для PAINS
    if (seoContext.icp) {
      const pains = seoContext.icp.pains || [];
      console.log(`\n📋 PAINS из ICP (${pains.length}):`);
      pains.forEach((pain: string, i: number) => {
        console.log(`   ${i + 1}. ${pain}`);
      });
    }

    // Тестируем генерацию идей для PAINS
    console.log(`\n=== ТЕСТИРОВАНИЕ ГЕНЕРАЦИИ ИДЕЙ ДЛЯ PAINS ===`);
    const { generateIdeasFromOpenAI } = await import("../src/services/contentIdeas/generator.js");
    
    console.log(`Запускаю генерацию...`);
    const generatedIdeas = await generateIdeasFromOpenAI({
      context: seoContext,
      category: "PAIN",
      count: 5,
      language: seoContext.language || "Russian",
    });

    console.log(`\n✅ Сгенерировано идей: ${generatedIdeas.length}`);
    console.log(`\n=== РЕЗУЛЬТАТЫ ===`);
    
    generatedIdeas.forEach((idea, i) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   ${idea.summary}`);
      
      // Проверяем релевантность
      const titleLower = idea.title.toLowerCase();
      const summaryLower = idea.summary.toLowerCase();
      const hasSoloFounder = titleLower.includes("solo") || titleLower.includes("founder") || 
                            summaryLower.includes("solo") || summaryLower.includes("founder");
      const hasPain = seoContext.icp?.pains?.some((p: string) => 
        titleLower.includes(p.toLowerCase()) || summaryLower.includes(p.toLowerCase())
      ) || false;
      
      console.log(`   Релевантность:`);
      console.log(`     - Solo founder: ${hasSoloFounder ? "✅" : "❌"}`);
      console.log(`     - Pain mention: ${hasPain ? "✅" : "❌"}`);
    });

    // Тестируем через GraphQL resolver (как фронтенд)
    console.log(`\n=== ТЕСТИРОВАНИЕ ЧЕРЕЗ GRAPHQL RESOLVER ===`);
    const { resolvers } = await import("../src/schema/resolvers.js");
    
    // Симулируем context как от фронтенда
    const mockContext = {
      userId: userId,
      projectId: projectId,
      hypothesisId: hypothesisId,
      token: "mock-token"
    };

    console.log(`Вызываю generateContentIdeas resolver...`);
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
    result.forEach((idea: any, i: number) => {
      console.log(`   ${i + 1}. ${idea.title}`);
    });

    console.log(`\n✅ ТЕСТ ПРОЙДЕН УСПЕШНО!`);
    console.log(`\n📋 РЕЗЮМЕ:`);
    console.log(`   ✅ Проект найден: ${project.title}`);
    console.log(`   ✅ Гипотеза найдена: ${hypothesis.title}`);
    console.log(`   ✅ Проверка принадлежности: OK`);
    console.log(`   ✅ SEO контекст загружен`);
    console.log(`   ✅ Генерация через generator: ${generatedIdeas.length} идей`);
    console.log(`   ✅ Генерация через GraphQL: ${result.length} идей`);

  } catch (error: any) {
    console.error("\n❌ Тест завершен с ошибкой:", error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Соединение с MongoDB закрыто");
  }
}

testFrontendPainsGeneration();

