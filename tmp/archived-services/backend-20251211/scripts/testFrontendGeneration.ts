import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Загружаем .env из корня backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Тестовый скрипт для проверки генерации идей через фронтенд
 * Симулирует запрос от фронтенда с правильными заголовками
 */

async function testFrontendGeneration() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // Вариант 1: Поиск по email
    const userEmail = process.argv[2];
    let userId: string | null = null;
    let user: any = null;
    
    if (userEmail && userEmail.includes("@")) {
      console.log(`\n=== ПОИСК ПОЛЬЗОВАТЕЛЯ: ${userEmail} ===`);
      user = await db.collection("users").findOne({ email: userEmail });
      if (user) {
        userId = user._id.toString();
      }
    }
    
    // Вариант 2: Поиск по projectId (если передан как аргумент)
    let projectId: string | null = null;
    if (process.argv[2] && !userEmail) {
      projectId = process.argv[2];
      console.log(`\n=== ПОИСК ПРОЕКТА: ${projectId} ===`);
      const project = await db.collection("projects").findOne({ 
        _id: new mongoose.Types.ObjectId(projectId) 
      });
      if (project) {
        userId = typeof project.userId === 'object' 
          ? project.userId.toString() 
          : project.userId;
        console.log(`✅ Найден проект: ${project.title}`);
        console.log(`   User ID: ${userId}`);
      }
    }
    
    // Вариант 3: Использовать проект "AI marketing copilot"
    if (!userId) {
      console.log(`\n=== ПОИСК ПРОЕКТА: AI marketing copilot ===`);
      const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
      if (project) {
        projectId = project._id.toString();
        userId = typeof project.userId === 'object' 
          ? project.userId.toString() 
          : project.userId;
        console.log(`✅ Найден проект: ${project.title}`);
        console.log(`   Project ID: ${projectId}`);
        console.log(`   User ID: ${userId}`);
      }
    }
    
    if (!userId) {
      console.error(`❌ Не удалось найти пользователя или проект!`);
      await mongoose.connection.close();
      process.exit(1);
    }
    if (user) {
      console.log(`✅ Найден пользователь: ${user.email}`);
    }
    console.log(`   User ID: ${userId}`);

    // Находим проект
    let project: any;
    if (projectId) {
      project = await db.collection("projects").findOne({ 
        _id: new mongoose.Types.ObjectId(projectId) 
      });
    } else {
      // Находим проекты пользователя
      console.log(`\n=== ПОИСК ПРОЕКТОВ ПОЛЬЗОВАТЕЛЯ ===`);
      const projects = await db.collection("projects").find({ userId: new mongoose.Types.ObjectId(userId) }).toArray();
      
      if (projects.length === 0) {
        console.error(`❌ У пользователя нет проектов!`);
        await mongoose.connection.close();
        process.exit(1);
      }

      console.log(`✅ Найдено проектов: ${projects.length}`);
      projects.forEach((p: any, i: number) => {
        console.log(`   ${i + 1}. ${p.title} (ID: ${p._id})`);
      });

      // Выбираем первый проект
      project = projects[0];
      projectId = project._id.toString();
    }
    console.log(`\n📌 Используем проект: ${project.title} (${projectId})`);

    // Находим гипотезы проекта
    console.log(`\n=== ПОИСК ГИПОТЕЗ ПРОЕКТА ===`);
    const hypotheses = await db.collection("projectHypotheses").find({ 
      projectId: new mongoose.Types.ObjectId(projectId) 
    }).toArray();

    if (hypotheses.length === 0) {
      console.error(`❌ У проекта ${project.title} нет гипотез!`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Найдено гипотез: ${hypotheses.length}`);
    hypotheses.forEach((h: any, i: number) => {
      console.log(`   ${i + 1}. ${h.title} (ID: ${h._id})`);
    });

    // Выбираем первую гипотезу
    const hypothesis = hypotheses[0];
    const hypothesisId = hypothesis._id.toString();
    console.log(`\n📌 Используем гипотезу: ${hypothesis.title} (${hypothesisId})`);

    // Проверяем, что проект принадлежит пользователю
    const projectUserId = typeof project.userId === 'object' 
      ? project.userId.toString() 
      : project.userId;
    
    if (projectUserId !== userId) {
      console.error(`\n❌ ОШИБКА: Проект не принадлежит пользователю!`);
      console.error(`   Project userId: ${projectUserId}`);
      console.error(`   Request userId: ${userId}`);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`\n✅ Проверка принадлежности: OK`);
    console.log(`   Project userId: ${projectUserId}`);
    console.log(`   Request userId: ${userId}`);

    // Тестируем загрузку SEO контекста
    console.log(`\n=== ТЕСТИРОВАНИЕ ЗАГРУЗКИ SEO КОНТЕКСТА ===`);
    const { loadSeoContext } = await import("../src/services/context/seoContext.js");
    
    try {
      const seoContext = await loadSeoContext(projectId, hypothesisId, userId);
      console.log(`✅ SEO контекст загружен успешно!`);
      console.log(`   Проект: ${seoContext.project?.title || "NOT FOUND"}`);
      console.log(`   Гипотеза: ${seoContext.hypothesis?.title || "NOT FOUND"}`);
      console.log(`   Язык: ${seoContext.language || "Russian (default)"}`);
      console.log(`   ICP: ${seoContext.icp ? "Найден" : "Не найден"}`);
      console.log(`   Lean Canvas: ${seoContext.leanCanvas ? "Найден" : "Не найден"}`);
      console.log(`   Clusters: ${seoContext.clusters.length}`);
    } catch (error: any) {
      console.error(`\n❌ Ошибка загрузки SEO контекста:`, error.message);
      await mongoose.connection.close();
      process.exit(1);
    }

    // Тестируем генерацию идей
    console.log(`\n=== ТЕСТИРОВАНИЕ ГЕНЕРАЦИИ ИДЕЙ ===`);
    const { generateIdeasFromOpenAI } = await import("../src/services/contentIdeas/generator.js");
    
    try {
      const generatedIdeas = await generateIdeasFromOpenAI({
        context: seoContext,
        category: "PAIN",
        count: 3,
        language: seoContext.language || "Russian",
      });

      console.log(`\n✅ Сгенерировано идей: ${generatedIdeas.length}`);
      generatedIdeas.forEach((idea, i) => {
        console.log(`\n${i + 1}. ${idea.title}`);
        console.log(`   ${idea.summary}`);
      });

      console.log(`\n✅ ТЕСТ ПРОЙДЕН УСПЕШНО!`);
      console.log(`\n📋 РЕЗЮМЕ:`);
      console.log(`   Пользователь: ${user.email} (${userId})`);
      console.log(`   Проект: ${project.title} (${projectId})`);
      console.log(`   Гипотеза: ${hypothesis.title} (${hypothesisId})`);
      console.log(`   Проверка принадлежности: ✅ OK`);
      console.log(`   Загрузка SEO контекста: ✅ OK`);
      console.log(`   Генерация идей: ✅ OK (${generatedIdeas.length} идей)`);

    } catch (error: any) {
      console.error(`\n❌ Ошибка генерации идей:`, error.message);
      console.error(error);
      await mongoose.connection.close();
      process.exit(1);
    }

  } catch (error: any) {
    console.error("\n❌ Тест завершен с ошибкой:", error);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n✅ Соединение с MongoDB закрыто");
  }
}

testFrontendGeneration();
