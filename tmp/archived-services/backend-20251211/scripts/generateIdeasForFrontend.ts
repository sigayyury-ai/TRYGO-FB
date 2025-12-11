import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Загружаем .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Генерирует идеи для PAINS через GraphQL resolver
 * Чтобы они появились на фронтенде
 */

async function generateIdeasForFrontend() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // Находим проект "AI marketing copilot"
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
    
    console.log(`✅ Проект: ${project.title} (${projectId})`);

    // Находим гипотезу "Solo founders"
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
    console.log(`✅ Гипотеза: ${hypothesis.title} (${hypothesisId})`);

    // Генерируем идеи через GraphQL resolver
    console.log(`\n🚀 Генерирую идеи для категории PAINS...\n`);
    
    const { resolvers } = await import("../src/schema/resolvers.js");
    
    const mockContext = {
      userId: userId,
      projectId: projectId,
      hypothesisId: hypothesisId,
      token: "mock-token-for-testing"
    };

    const result = await resolvers.Mutation.generateContentIdeas(
      null,
      {
        projectId: projectId,
        hypothesisId: hypothesisId,
        category: "PAINS"
      },
      mockContext
    );

    console.log(`\n✅ Сгенерировано идей: ${result.length}\n`);
    console.log("=== СГЕНЕРИРОВАННЫЕ ИДЕИ ===\n");
    
    result.forEach((idea: any, i: number) => {
      console.log(`${i + 1}. ${idea.title}`);
      console.log(`   ${idea.description || "Нет описания"}\n`);
    });

    // Проверяем сохранение в БД
    const savedCount = await db.collection("seocontentitems").countDocuments({
      projectId: projectId,
      hypothesisId: hypothesisId,
      category: "pain"
    });

    console.log(`\n✅ Идеи сохранены в БД: ${savedCount} шт.`);
    console.log(`\n🎉 ГОТОВО! Теперь откройте фронтенд и перейдите в SEO Agent -> Content`);
    console.log(`   Вы увидите ${result.length} новых идей для категории PAINS!\n`);

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

generateIdeasForFrontend();

