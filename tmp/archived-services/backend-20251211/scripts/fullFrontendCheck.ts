import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Полная проверка всех аспектов работы фронтенда
 * Проверяет все логи, данные, и возможные проблемы
 */

async function fullFrontendCheck() {
  const results = {
    mongoConnection: false,
    projectFound: false,
    hypothesisFound: false,
    ideasInDB: 0,
    ideasViaQuery: 0,
    painsIdeas: 0,
    errors: [] as string[],
    warnings: [] as string[],
  };

  try {
    console.log("=".repeat(70));
    console.log("🔍 ПОЛНАЯ ПРОВЕРКА ФРОНТЕНДА");
    console.log("=".repeat(70));
    console.log();

    // 1. Подключение к MongoDB
    console.log("1️⃣ ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БД");
    console.log("-".repeat(70));
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      results.errors.push("MONGODB_URI не установлен");
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    results.mongoConnection = true;
    console.log("✅ Подключение к MongoDB успешно");
    console.log();

    const db = mongoose.connection.db;
    
    // 2. Поиск проекта
    console.log("2️⃣ ПОИСК ПРОЕКТА");
    console.log("-".repeat(70));
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    
    if (!project) {
      results.errors.push("Проект 'AI marketing copilot' не найден");
      console.error("❌ Проект 'AI marketing copilot' не найден!");
      throw new Error("Project not found");
    }

    const projectId = project._id.toString();
    const userId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    results.projectFound = true;
    
    console.log(`✅ Проект найден: ${project.title}`);
    console.log(`   Project ID: ${projectId}`);
    console.log(`   User ID: ${userId}`);
    console.log();

    // 3. Поиск гипотезы
    console.log("3️⃣ ПОИСК ГИПОТЕЗЫ");
    console.log("-".repeat(70));
    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });

    if (!hypothesis) {
      results.errors.push("Гипотеза 'Solo founders' не найдена");
      console.error("❌ Гипотеза 'Solo founders' не найдена!");
      throw new Error("Hypothesis not found");
    }

    const hypothesisId = hypothesis._id.toString();
    results.hypothesisFound = true;
    
    console.log(`✅ Гипотеза найдена: ${hypothesis.title}`);
    console.log(`   Hypothesis ID: ${hypothesisId}`);
    console.log(`   Project ID: ${hypothesis.projectId}`);
    console.log();

    // 4. Проверка данных в БД
    console.log("4️⃣ ПРОВЕРКА ДАННЫХ В БД");
    console.log("-".repeat(70));
    const ideasInDB = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      category: "pain",
      status: { $ne: "archived" }
    }).toArray();

    results.ideasInDB = ideasInDB.length;
    
    console.log(`✅ Найдено идей в БД: ${ideasInDB.length}`);
    if (ideasInDB.length === 0) {
      results.warnings.push("В БД нет идей для этого проекта и гипотезы");
      console.warn("⚠️ В БД нет идей!");
    } else {
      console.log("Последние 3 идеи из БД:");
      ideasInDB.slice(0, 3).forEach((idea, i) => {
        console.log(`   ${i + 1}. ${idea.title}`);
        console.log(`      ID: ${idea._id.toString()}`);
        console.log(`      Category: ${idea.category}`);
        console.log(`      Status: ${idea.status || 'NEW'}`);
      });
    }
    console.log();

    // 5. Проверка через GraphQL Query (как фронтенд)
    console.log("5️⃣ ПРОВЕРКА ЧЕРЕЗ GRAPHQL QUERY (как фронтенд)");
    console.log("-".repeat(70));
    console.log("Симулирую запрос от фронтенда...");
    console.log();

    const { resolvers } = await import("../src/schema/resolvers.js");
    const mockContext = {
      userId: userId
    };

    console.log("📤 Запрос:");
    console.log(`   projectId: ${projectId}`);
    console.log(`   hypothesisId: ${hypothesisId}`);
    console.log(`   userId: ${userId}`);
    console.log();

    const queryResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      mockContext
    );

    const ideas = queryResult || [];
    const painsIdeas = ideas.filter((idea: any) => idea.category === "PAINS");
    
    results.ideasViaQuery = ideas.length;
    results.painsIdeas = painsIdeas.length;

    console.log("📥 Ответ:");
    console.log(`   Всего идей: ${ideas.length}`);
    console.log(`   Идей PAINS: ${painsIdeas.length}`);
    console.log();

    if (ideas.length > 0) {
      console.log("Первые 3 идеи из ответа:");
      ideas.slice(0, 3).forEach((idea: any, i: number) => {
        console.log(`   ${i + 1}. ${idea.title}`);
        console.log(`      ID: ${idea.id}`);
        console.log(`      Category: ${idea.category}`);
        console.log(`      Dismissed: ${idea.dismissed || false}`);
      });
    } else {
      results.warnings.push("GraphQL query вернул 0 идей");
      console.warn("⚠️ GraphQL query вернул 0 идей!");
    }
    console.log();

    // 6. Сравнение данных
    console.log("6️⃣ СРАВНЕНИЕ ДАННЫХ");
    console.log("-".repeat(70));
    if (results.ideasInDB !== results.ideasViaQuery) {
      results.warnings.push(`Несоответствие: в БД ${results.ideasInDB} идей, через query ${results.ideasViaQuery}`);
      console.warn(`⚠️ Несоответствие: в БД ${results.ideasInDB} идей, через query ${results.ideasViaQuery}`);
    } else {
      console.log(`✅ Количество совпадает: ${results.ideasInDB} идей`);
    }
    console.log();

    // 7. Проверка структуры данных
    console.log("7️⃣ ПРОВЕРКА СТРУКТУРЫ ДАННЫХ");
    console.log("-".repeat(70));
    if (ideas.length > 0) {
      const firstIdea = ideas[0] as any;
      const requiredFields = ['id', 'title', 'category', 'projectId', 'hypothesisId'];
      const missingFields = requiredFields.filter(field => !(field in firstIdea));
      
      if (missingFields.length > 0) {
        results.errors.push(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
        console.error(`❌ Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
      } else {
        console.log("✅ Все обязательные поля присутствуют");
        console.log("   Поля:", Object.keys(firstIdea).join(', '));
      }
    }
    console.log();

    // 8. Итоговый отчет
    console.log("=".repeat(70));
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=".repeat(70));
    console.log();
    
    console.log("✅ Успешные проверки:");
    if (results.mongoConnection) console.log("   ✅ Подключение к MongoDB");
    if (results.projectFound) console.log("   ✅ Проект найден");
    if (results.hypothesisFound) console.log("   ✅ Гипотеза найдена");
    if (results.ideasInDB > 0) console.log(`   ✅ Идеи в БД: ${results.ideasInDB}`);
    if (results.ideasViaQuery > 0) console.log(`   ✅ Идеи через query: ${results.ideasViaQuery}`);
    console.log();

    if (results.warnings.length > 0) {
      console.log("⚠️ Предупреждения:");
      results.warnings.forEach(warning => console.log(`   ⚠️ ${warning}`));
      console.log();
    }

    if (results.errors.length > 0) {
      console.log("❌ Ошибки:");
      results.errors.forEach(error => console.log(`   ❌ ${error}`));
      console.log();
    }

    // 9. Что должно быть в консоли браузера
    console.log("=".repeat(70));
    console.log("💡 ЧТО ДОЛЖНО БЫТЬ В КОНСОЛИ БРАУЗЕРА");
    console.log("=".repeat(70));
    console.log();
    console.log("При открытии http://localhost:8080/seo-agent#content:");
    console.log();
    console.log(`[SeoContentPanel] 📥 Loading content ideas: {`);
    console.log(`  projectId: '${projectId}',`);
    console.log(`  hypothesisId: '${hypothesisId}'`);
    console.log(`}`);
    console.log();
    console.log(`[SeoContentPanel] ✅ Loaded ideas: ${results.ideasViaQuery}`);
    console.log();
    if (results.ideasViaQuery > 0) {
      console.log(`[SeoContentPanel] Sample ideas: [`);
      ideas.slice(0, 3).forEach((idea: any, i: number) => {
        const comma = i < 2 ? ',' : '';
        console.log(`  '${idea.title}'${comma}`);
      });
      console.log(`]`);
    } else {
      console.log(`[SeoContentPanel] ⚠️ No ideas returned from API`);
    }
    console.log();

    // 10. Финальный вердикт
    console.log("=".repeat(70));
    if (results.errors.length === 0 && results.ideasViaQuery > 0) {
      console.log("✅✅✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ УСПЕШНО! ✅✅✅");
      console.log();
      console.log("Фронтенд должен корректно отображать идеи!");
    } else if (results.errors.length > 0) {
      console.log("❌ ОБНАРУЖЕНЫ ОШИБКИ!");
      console.log("Требуется исправление перед использованием.");
    } else {
      console.log("⚠️ ВСЕ РАБОТАЕТ, НО ЕСТЬ ПРЕДУПРЕЖДЕНИЯ");
    }
    console.log("=".repeat(70));

    await mongoose.connection.close();
  } catch (error: any) {
    console.error("\n❌ Критическая ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    
    console.log("\n📊 Частичные результаты:");
    console.log(JSON.stringify(results, null, 2));
    
    process.exit(1);
  }
}

fullFrontendCheck();


