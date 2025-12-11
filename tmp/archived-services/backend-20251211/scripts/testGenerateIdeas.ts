import mongoose from "mongoose";
import "dotenv/config";
import { loadSeoContext } from "../src/services/context/seoContext.js";
import { generateIdeasFromOpenAI } from "../src/services/contentIdeas/generator.js";

async function testGenerateIdeas() {
  try {
    // Подключение к MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Получить projectId и hypothesisId из аргументов командной строки или переменных окружения
    const args = process.argv.slice(2);
    let targetProjectId: string | null = args[0] || process.env.TEST_PROJECT_ID || null;
    let targetHypothesisId: string | null = args[1] || process.env.TEST_HYPOTHESIS_ID || null;

    const db = mongoose.connection.db;
    
    // Если ID не указаны, попробуем найти Solo founders
    if (!targetProjectId || !targetHypothesisId) {
      console.log("\n=== ПОИСК ПРОЕКТА И ГИПОТЕЗЫ SOLO FOUNDERS ===");
      const projects = await db.collection("projects").find({}).toArray();
      console.log(`Всего проектов: ${projects.length}`);

      for (const project of projects) {
        const hypotheses = await db
          .collection("projectHypotheses")
          .find({ projectId: project._id })
          .toArray();

        for (const h of hypotheses) {
          const title = h.title?.toLowerCase() || "";
          if (title.includes("solo") || title.includes("founder")) {
            targetProjectId = project._id.toString();
            targetHypothesisId = h._id.toString();
            console.log(`\n✅ НАЙДЕНА ГИПОТЕЗА: ${h.title}`);
            console.log(`   Проект: ${project.title}`);
            console.log(`   Project ID: ${targetProjectId}`);
            console.log(`   Hypothesis ID: ${targetHypothesisId}`);
            break;
          }
        }
        if (targetProjectId) break;
      }

      if (!targetProjectId || !targetHypothesisId) {
        console.error("\n❌ Проект или гипотеза Solo founders не найдены!");
        console.log("\nДоступные проекты и гипотезы:");
        for (const project of projects) {
          console.log(`\nПроект: ${project.title} (ID: ${project._id})`);
          const hypotheses = await db
            .collection("projectHypotheses")
            .find({ projectId: project._id })
            .toArray();
          hypotheses.forEach((h) => {
            console.log(`  - ${h.title} (ID: ${h._id})`);
          });
        }
        console.log("\n💡 Использование:");
        console.log("   npx tsx scripts/testGenerateIdeas.ts <projectId> <hypothesisId>");
        console.log("   или установите переменные окружения:");
        console.log("   TEST_PROJECT_ID=... TEST_HYPOTHESIS_ID=... npx tsx scripts/testGenerateIdeas.ts");
        await mongoose.connection.close();
        process.exit(1);
      }
    } else {
      console.log("\n=== ИСПОЛЬЗУЮ УКАЗАННЫЕ ID ===");
      console.log(`Project ID: ${targetProjectId}`);
      console.log(`Hypothesis ID: ${targetHypothesisId}`);
    }

    // Получаем названия для анализа
    let project: any;
    let hypothesis: any;
    
    try {
      project = await db.collection("projects").findOne({ _id: new mongoose.Types.ObjectId(targetProjectId) });
      if (!project) {
        // Попробуем найти по названию, если по ID не нашли
        const projects = await db.collection("projects").find({}).toArray();
        for (const p of projects) {
          const title = (p.title || "").toLowerCase();
          if (title.includes("ai marketing") || title.includes("marketing copilot")) {
            project = p;
            targetProjectId = p._id.toString();
            console.log(`✅ Проект найден по названию: ${project.title} (ID: ${targetProjectId})`);
            break;
          }
        }
      }
      
      if (project) {
        hypothesis = await db.collection("projectHypotheses").findOne({ 
          _id: new mongoose.Types.ObjectId(targetHypothesisId),
          projectId: new mongoose.Types.ObjectId(targetProjectId)
        });
        
        if (!hypothesis) {
          // Попробуем найти по названию
          const hypotheses = await db.collection("projectHypotheses").find({ projectId: project._id }).toArray();
          for (const h of hypotheses) {
            const hTitle = (h.title || "").toLowerCase();
            if (hTitle.includes("solo") || hTitle.includes("founder")) {
              hypothesis = h;
              targetHypothesisId = h._id.toString();
              console.log(`✅ Гипотеза найдена по названию: ${hypothesis.title} (ID: ${targetHypothesisId})`);
              break;
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Ошибка при поиске проекта/гипотезы:", err?.message || err);
      throw err;
    }

    if (!project) {
      throw new Error(`Project not found: ${targetProjectId}. Убедитесь, что проект существует в базе данных.`);
    }
    if (!hypothesis) {
      throw new Error(`Hypothesis not found: ${targetHypothesisId} for project ${targetProjectId}. Убедитесь, что гипотеза существует и принадлежит проекту.`);
    }

    const targetProjectTitle = project.title || "Unknown";
    const targetHypothesisTitle = hypothesis.title || "Unknown";
    
    console.log(`\n✅ Проект: ${targetProjectTitle}`);
    console.log(`✅ Гипотеза: ${targetHypothesisTitle}`);

    // Загружаем SEO контекст
    console.log("\n=== ЗАГРУЗКА SEO КОНТЕКСТА ===");
    const seoContext = await loadSeoContext(targetProjectId, targetHypothesisId);
    
    console.log(`✅ Проект: ${seoContext.project?.title || "NOT FOUND"}`);
    console.log(`✅ Гипотеза: ${seoContext.hypothesis?.title || "NOT FOUND"}`);
    console.log(`✅ Язык: ${seoContext.language || "Russian (default)"}`);
    console.log(`✅ ICP: ${seoContext.icp ? "Найден" : "Не найден"}`);
    console.log(`✅ Lean Canvas: ${seoContext.leanCanvas ? "Найден" : "Не найден"}`);
    console.log(`✅ Clusters: ${seoContext.clusters.length}`);

    // Показываем контекст для анализа
    if (seoContext.icp) {
      console.log("\n=== ICP ДАННЫЕ ===");
      console.log(`Persona: ${seoContext.icp.persona || "Не указан"}`);
      console.log(`Pains: ${Array.isArray(seoContext.icp.pains) ? seoContext.icp.pains.length : 0}`);
      if (Array.isArray(seoContext.icp.pains) && seoContext.icp.pains.length > 0) {
        console.log("Список болей:");
        seoContext.icp.pains.forEach((pain: any, i: number) => {
          console.log(`  ${i + 1}. ${pain}`);
        });
      }
      console.log(`Goals: ${Array.isArray(seoContext.icp.goals) ? seoContext.icp.goals.length : 0}`);
      console.log(`Triggers: ${Array.isArray(seoContext.icp.triggers) ? seoContext.icp.triggers.length : 0}`);
    }

    if (seoContext.leanCanvas) {
      console.log("\n=== LEAN CANVAS ДАННЫЕ ===");
      const problems = Array.isArray(seoContext.leanCanvas.problems) ? seoContext.leanCanvas.problems : [];
      const solutions = Array.isArray(seoContext.leanCanvas.solutions) ? seoContext.leanCanvas.solutions : [];
      console.log(`Problems: ${problems.length}`);
      if (problems.length > 0) {
        console.log("Список проблем:");
        problems.forEach((p: any, i: number) => {
          console.log(`  ${i + 1}. ${p}`);
        });
      }
      console.log(`Solutions: ${solutions.length}`);
      if (solutions.length > 0) {
        console.log("Список решений:");
        solutions.forEach((s: any, i: number) => {
          console.log(`  ${i + 1}. ${s}`);
        });
      }
    }

    // Генерируем идеи для категории PAINS
    console.log("\n=== ГЕНЕРАЦИЯ ИДЕЙ ДЛЯ КАТЕГОРИИ PAINS ===");
    console.log("Используется стандартный генератор и промпт...\n");

    const generatedIdeas = await generateIdeasFromOpenAI({
      context: seoContext,
      category: "PAIN",
      count: 5,
      language: seoContext.language || "Russian"
    });

    console.log(`\n✅ Сгенерировано идей: ${generatedIdeas.length}\n`);

    // Анализ результатов
    console.log("=== АНАЛИЗ СГЕНЕРИРОВАННЫХ ИДЕЙ ===");
    console.log(`Проект: ${targetProjectTitle}`);
    console.log(`Гипотеза: ${targetHypothesisTitle}\n`);

    generatedIdeas.forEach((idea, index) => {
      console.log(`\n${index + 1}. ${idea.title}`);
      console.log(`   Описание: ${idea.summary}`);
      
      // Проверка релевантности
      const titleLower = idea.title.toLowerCase();
      const summaryLower = idea.summary.toLowerCase();
      const projectLower = targetProjectTitle.toLowerCase();
      const hypothesisLower = targetHypothesisTitle.toLowerCase();
      
      const mentionsProject = projectLower.includes("ai marketing") || 
                             projectLower.includes("marketing copilot") ||
                             titleLower.includes("marketing") ||
                             summaryLower.includes("marketing");
      
      const mentionsSoloFounder = titleLower.includes("solo") ||
                                  titleLower.includes("founder") ||
                                  summaryLower.includes("solo") ||
                                  summaryLower.includes("founder") ||
                                  hypothesisLower.includes("solo") ||
                                  hypothesisLower.includes("founder");
      
      const mentionsPain = titleLower.includes("проблем") ||
                          titleLower.includes("боль") ||
                          titleLower.includes("сложност") ||
                          summaryLower.includes("проблем") ||
                          summaryLower.includes("боль") ||
                          summaryLower.includes("сложност");
      
      console.log(`   Релевантность:`);
      console.log(`     - Упоминание проекта: ${mentionsProject ? "✅" : "❌"}`);
      console.log(`     - Упоминание Solo Founder: ${mentionsSoloFounder ? "✅" : "❌"}`);
      console.log(`     - Фокус на боли: ${mentionsPain ? "✅" : "❌"}`);
      
      // Проверка связи с ICP pains
      if (seoContext.icp && Array.isArray(seoContext.icp.pains)) {
        const relevantPains = seoContext.icp.pains.filter((pain: any) => {
          const painStr = String(pain).toLowerCase();
          return titleLower.includes(painStr) || summaryLower.includes(painStr);
        });
        if (relevantPains.length > 0) {
          console.log(`     - Связь с ICP pains: ✅ (${relevantPains.length} совпадений)`);
          relevantPains.forEach((pain: any) => {
            console.log(`       • ${pain}`);
          });
        } else {
          console.log(`     - Связь с ICP pains: ⚠️  (нет прямых совпадений)`);
        }
      }
    });

    // Итоговая статистика
    console.log("\n=== ИТОГОВАЯ СТАТИСТИКА ===");
    const relevantCount = generatedIdeas.filter((idea) => {
      const titleLower = idea.title.toLowerCase();
      const summaryLower = idea.summary.toLowerCase();
      return (
        titleLower.includes("marketing") ||
        summaryLower.includes("marketing") ||
        titleLower.includes("solo") ||
        summaryLower.includes("solo") ||
        titleLower.includes("founder") ||
        summaryLower.includes("founder")
      );
    }).length;

    console.log(`Всего идей: ${generatedIdeas.length}`);
    console.log(`Релевантных идей: ${relevantCount} (${Math.round((relevantCount / generatedIdeas.length) * 100)}%)`);
    console.log(`Не релевантных: ${generatedIdeas.length - relevantCount}`);

    await mongoose.connection.close();
    console.log("\n✅ Тест завершен успешно!");
  } catch (error) {
    console.error("\n❌ Ошибка при выполнении теста:", error);
    if (error instanceof Error) {
      console.error("Сообщение:", error.message);
      console.error("Stack:", error.stack);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Запуск теста
testGenerateIdeas();

