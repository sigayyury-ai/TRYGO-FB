import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Полный тест фронтенда: проверяет все аспекты и находит проблемы
 */

async function fullFrontendTest() {
  const issues: string[] = [];
  const fixes: string[] = [];

  try {
    console.log("=".repeat(70));
    console.log("🧪 ПОЛНЫЙ ТЕСТ ФРОНТЕНДА");
    console.log("=".repeat(70));
    console.log();

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    // 1. Находим проект и гипотезу
    console.log("1️⃣ ПОИСК ДАННЫХ");
    console.log("-".repeat(70));
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    if (!project) {
      issues.push("Проект 'AI marketing copilot' не найден");
      throw new Error("Project not found");
    }

    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });
    if (!hypothesis) {
      issues.push("Гипотеза 'Solo founders' не найдена");
      throw new Error("Hypothesis not found");
    }

    const projectId = project._id.toString();
    const hypothesisId = hypothesis._id.toString();
    const userId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    
    console.log(`✅ Project: ${project.title} (${projectId})`);
    console.log(`✅ Hypothesis: ${hypothesis.title} (${hypothesisId})`);
    console.log();

    // 2. Проверяем идеи в БД
    console.log("2️⃣ ПРОВЕРКА ИДЕЙ В БД");
    console.log("-".repeat(70));
    const ideasInDB = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      status: { $ne: "archived" }
    }).toArray();

    console.log(`✅ Идей в БД: ${ideasInDB.length}`);
    if (ideasInDB.length === 0) {
      issues.push("В БД нет идей для отображения");
    }
    console.log();

    // 3. Проверяем через GraphQL resolver
    console.log("3️⃣ ПРОВЕРКА GRAPHQL RESOLVER");
    console.log("-".repeat(70));
    const { resolvers } = await import("../src/schema/resolvers.js");
    
    const queryResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      { userId }
    );

    console.log(`✅ Идей через resolver: ${queryResult.length}`);
    
    if (queryResult.length === 0 && ideasInDB.length > 0) {
      issues.push("Resolver возвращает 0 идей, хотя в БД есть идеи");
    }
    
    if (queryResult.length > 0) {
      const firstIdea = queryResult[0] as any;
      console.log(`   Первая идея: ${firstIdea.title}`);
      console.log(`   Category: ${firstIdea.category}`);
      console.log(`   Status: ${firstIdea.status}`);
      console.log(`   Dismissed: ${firstIdea.dismissed}`);
      
      // Проверяем маппинг категорий
      if (firstIdea.category !== "PAINS" && ideasInDB[0]?.category === "pain") {
        issues.push("Категория не маппится правильно: pain -> PAINS");
      }
    }
    console.log();

    // 4. Проверяем через реальный HTTP запрос (как фронтенд)
    console.log("4️⃣ ПРОВЕРКА ЧЕРЕЗ HTTP (как фронтенд)");
    console.log("-".repeat(70));
    const seoAgentUrl = process.env.SEO_AGENT_URL || "http://localhost:4100/graphql";
    
    const graphqlQuery = `
      query GetSeoAgentContentIdeas($projectId: ID!, $hypothesisId: ID) {
        seoAgentContentIdeas(projectId: $projectId, hypothesisId: $hypothesisId) {
          id
          title
          category
          status
          dismissed
          projectId
          hypothesisId
        }
      }
    `;

    try {
      const response = await fetch(seoAgentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: graphqlQuery,
          variables: {
            projectId,
            hypothesisId
          }
        }),
      });

      const result = await response.json();
      
      if (result.errors) {
        issues.push(`GraphQL ошибка: ${JSON.stringify(result.errors)}`);
        console.error("❌ GraphQL ошибки:", result.errors);
      } else {
        const ideas = result.data?.seoAgentContentIdeas || [];
        console.log(`✅ Идей через HTTP: ${ideas.length}`);
        
        if (ideas.length === 0 && queryResult.length > 0) {
          issues.push("HTTP запрос возвращает 0 идей, хотя resolver работает");
        }
        
        if (ideas.length > 0) {
          console.log(`   Первая идея: ${ideas[0].title}`);
          console.log(`   Category: ${ideas[0].category}`);
        }
      }
    } catch (error: any) {
      issues.push(`HTTP запрос не работает: ${error.message}`);
      console.warn("⚠️ HTTP запрос не работает (возможно бэкенд не запущен)");
    }
    console.log();

    // 5. Проверяем структуру данных
    console.log("5️⃣ ПРОВЕРКА СТРУКТУРЫ ДАННЫХ");
    console.log("-".repeat(70));
    if (queryResult.length > 0) {
      const idea = queryResult[0] as any;
      const requiredFields = ['id', 'title', 'category', 'projectId', 'hypothesisId'];
      const missingFields = requiredFields.filter(field => !(field in idea));
      
      if (missingFields.length > 0) {
        issues.push(`Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
      } else {
        console.log("✅ Все обязательные поля присутствуют");
      }
      
      // Проверяем категорию
      if (idea.category && !['PAINS', 'GOALS', 'TRIGGERS', 'PRODUCT_FEATURES', 'BENEFITS', 'FAQS', 'INFORMATIONAL'].includes(idea.category)) {
        issues.push(`Неизвестная категория: ${idea.category}`);
      }
    }
    console.log();

    // 6. Итоговый отчет и рекомендации
    console.log("=".repeat(70));
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=".repeat(70));
    console.log();
    
    if (issues.length === 0) {
      console.log("✅ Все проверки пройдены успешно!");
      console.log();
      console.log("💡 РЕКОМЕНДАЦИИ:");
      console.log("   1. Обновите страницу фронтенда (F5)");
      console.log("   2. Откройте консоль браузера (F12)");
      console.log("   3. Проверьте логи [SeoContentPanel]");
      console.log("   4. Если идеи не отображаются, проверьте:");
      console.log("      - Правильно ли передается hypothesisId");
      console.log("      - Нет ли ошибок в консоли");
      console.log("      - Правильно ли работает ContentIdeasList");
    } else {
      console.log("❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ:");
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log();
      console.log("🔧 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:");
      
      if (issues.some(i => i.includes("категория не маппится"))) {
        console.log("   - Проверьте mapContentIdea в resolvers.ts");
        fixes.push("Проверить маппинг категорий в mapContentIdea");
      }
      
      if (issues.some(i => i.includes("HTTP запрос"))) {
        console.log("   - Убедитесь, что бэкенд запущен на порту 4100");
        fixes.push("Запустить бэкенд на порту 4100");
      }
      
      if (issues.some(i => i.includes("0 идей"))) {
        console.log("   - Проверьте фильтры в seoAgentContentIdeas resolver");
        fixes.push("Проверить фильтры в resolver");
      }
    }
    console.log();

    await mongoose.connection.close();
    
    // Возвращаем результаты для автоматического исправления
    return { issues, fixes, projectId, hypothesisId, ideasCount: queryResult.length };
  } catch (error: any) {
    console.error("\n❌ Критическая ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

fullFrontendTest().then(result => {
  if (result && result.issues.length > 0) {
    console.log("\n🔧 АВТОМАТИЧЕСКИЕ ИСПРАВЛЕНИЯ:");
    result.fixes.forEach((fix, i) => {
      console.log(`   ${i + 1}. ${fix}`);
    });
  }
});



