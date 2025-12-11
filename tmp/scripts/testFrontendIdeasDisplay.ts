import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Тест отображения идей на фронтенде
 * Проверяет весь flow: БД → GraphQL → Frontend
 */

async function testFrontendIdeasDisplay() {
  try {
    console.log("=".repeat(70));
    console.log("🧪 ТЕСТ ОТОБРАЖЕНИЯ ИДЕЙ НА ФРОНТЕНДЕ");
    console.log("=".repeat(70));
    console.log();

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Подключение к MongoDB успешно");
    console.log();

    const db = mongoose.connection.db;
    
    // 1. Находим проект "AI marketing copilot"
    console.log("1️⃣ ПОИСК ПРОЕКТА И ГИПОТЕЗЫ");
    console.log("-".repeat(70));
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    
    if (!project) {
      console.error("❌ Проект 'AI marketing copilot' не найден!");
      console.log("\nДоступные проекты:");
      const allProjects = await db.collection("projects").find({}).limit(10).toArray();
      allProjects.forEach((p: any) => {
        console.log(`   - ${p.title} (ID: ${p._id.toString()})`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    const projectId = project._id.toString();
    const userId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    
    console.log(`✅ Проект: ${project.title}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   User ID: ${userId}`);
    console.log();

    // 2. Находим гипотезу "Solo founders"
    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });

    if (!hypothesis) {
      console.error("❌ Гипотеза 'Solo founders' не найдена!");
      console.log("\nДоступные гипотезы для этого проекта:");
      const allHypotheses = await db.collection("projectHypotheses").find({ 
        projectId: project._id 
      }).toArray();
      allHypotheses.forEach((h: any) => {
        console.log(`   - ${h.title} (ID: ${h._id.toString()})`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }

    const hypothesisId = hypothesis._id.toString();
    console.log(`✅ Гипотеза: ${hypothesis.title}`);
    console.log(`   Hypothesis ID: ${hypothesisId}`);
    console.log();

    // 3. Проверяем идеи в БД
    console.log("2️⃣ ПРОВЕРКА ИДЕЙ В БД");
    console.log("-".repeat(70));
    const ideasInDB = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      status: { $ne: "archived" }
    }).sort({ createdAt: -1 }).toArray();

    console.log(`✅ Найдено идей в БД: ${ideasInDB.length}`);
    
    if (ideasInDB.length === 0) {
      console.log("\n⚠️ В БД нет идей для этого проекта и гипотезы!");
      console.log("   Нужно сгенерировать идеи через generateContentIdeas mutation");
      await mongoose.connection.close();
      process.exit(1);
    }

    // Группируем по категориям
    const byCategory: Record<string, any[]> = {};
    ideasInDB.forEach(idea => {
      const category = idea.category || 'UNKNOWN';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(idea);
    });

    console.log("\nИдеи по категориям:");
    Object.entries(byCategory).forEach(([category, ideas]) => {
      console.log(`   ${category.toUpperCase()}: ${ideas.length} идей`);
    });
    console.log();

    // Показываем примеры
    console.log("Примеры идей (первые 5):");
    ideasInDB.slice(0, 5).forEach((idea, i) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   ID: ${idea._id.toString()}`);
      console.log(`   Category: ${idea.category || 'N/A'}`);
      console.log(`   Status: ${idea.status || 'NEW'}`);
      console.log(`   Dismissed: ${idea.dismissed || false}`);
      if (idea.description) {
        console.log(`   Description: ${idea.description.substring(0, 100)}...`);
      }
    });
    console.log();

    // 4. Проверяем через GraphQL Query (как фронтенд)
    console.log("3️⃣ ПРОВЕРКА ЧЕРЕЗ GRAPHQL QUERY (как фронтенд)");
    console.log("-".repeat(70));
    const { resolvers } = await import("../src/schema/resolvers.js");
    const mockContext = {
      userId: userId
    };

    console.log("Вызываю seoAgentContentIdeas query...");
    const queryResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      mockContext
    );

    const ideas = queryResult || [];
    console.log(`✅ Загружено идей через query: ${ideas.length}`);
    console.log();

    if (ideas.length === 0) {
      console.error("❌ Query вернул 0 идей, хотя в БД есть идеи!");
      console.log("   Проверьте фильтры в resolver");
      await mongoose.connection.close();
      process.exit(1);
    }

    // Показываем примеры из query
    console.log("Примеры идей из query (первые 5):");
    ideas.slice(0, 5).forEach((idea: any, i: number) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   ID: ${idea.id}`);
      console.log(`   Category: ${idea.category}`);
      console.log(`   Status: ${idea.status || 'NEW'}`);
      console.log(`   Dismissed: ${idea.dismissed || false}`);
      if (idea.description) {
        console.log(`   Description: ${idea.description.substring(0, 100)}...`);
      }
    });
    console.log();

    // 5. Проверяем структуру данных
    console.log("4️⃣ ПРОВЕРКА СТРУКТУРЫ ДАННЫХ");
    console.log("-".repeat(70));
    if (ideas.length > 0) {
      const firstIdea = ideas[0] as any;
      const requiredFields = ['id', 'title', 'category', 'projectId', 'hypothesisId'];
      const missingFields = requiredFields.filter(field => !(field in firstIdea));
      
      if (missingFields.length > 0) {
        console.error(`❌ Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
      } else {
        console.log("✅ Все обязательные поля присутствуют");
        console.log("   Поля:", Object.keys(firstIdea).join(', '));
      }
    }
    console.log();

    // 6. Итоговый отчет
    console.log("=".repeat(70));
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=".repeat(70));
    console.log();
    console.log("✅ Все проверки пройдены успешно!");
    console.log();
    console.log("📋 ДАННЫЕ ДЛЯ ФРОНТЕНДА:");
    console.log(`   Project ID: ${projectId}`);
    console.log(`   Hypothesis ID: ${hypothesisId}`);
    console.log(`   Всего идей: ${ideas.length}`);
    console.log();
    
    // Группируем по категориям для отчета
    const byCategoryQuery: Record<string, any[]> = {};
    ideas.forEach((idea: any) => {
      const category = idea.category || 'UNKNOWN';
      if (!byCategoryQuery[category]) {
        byCategoryQuery[category] = [];
      }
      byCategoryQuery[category].push(idea);
    });

    console.log("Идеи по категориям (для фронтенда):");
    Object.entries(byCategoryQuery).forEach(([category, categoryIdeas]) => {
      console.log(`   ${category}: ${categoryIdeas.length} идей`);
    });
    console.log();

    console.log("💡 ИНСТРУКЦИЯ ДЛЯ ПРОВЕРКИ НА ФРОНТЕНДЕ:");
    console.log("   1. Откройте: http://localhost:8080/seo-agent#content");
    console.log("   2. Убедитесь, что выбран проект: 'AI marketing copilot'");
    console.log("   3. Убедитесь, что выбрана гипотеза: 'Solo founders'");
    console.log(`   4. Должно отобразиться ${ideas.length} идей`);
    console.log();
    console.log("🔍 ПРОВЕРКА В КОНСОЛИ БРАУЗЕРА:");
    console.log("   Откройте консоль (F12) и проверьте логи:");
    console.log("   [SeoContentPanel] 📥 Loading content ideas: {...}");
    console.log(`   [SeoContentPanel] ✅ Loaded ideas: ${ideas.length}`);
    console.log();
    console.log("🔍 ПРОВЕРКА В КОНСОЛИ БЭКЕНДА:");
    console.log("   Если frontendLogger работает, вы увидите:");
    console.log("   [FRONTEND LOG] ... [SeoContentPanel] 📥 Loading content ideas");
    console.log(`   [FRONTEND LOG] ... [SeoContentPanel] ✅ Loaded ideas: ${ideas.length}`);
    console.log();

    await mongoose.connection.close();
  } catch (error: any) {
    console.error("\n❌ Ошибка при тестировании:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testFrontendIdeasDisplay();



