import mongoose from "mongoose";
import "dotenv/config";
import { loadSeoContext } from "../src/services/context/seoContext.js";
import { generateIdeasFromOpenAI } from "../src/services/contentIdeas/generator.js";

async function createTestData(db: any) {
  console.log("\n=== СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ ===");
  
  // Создаем тестовый проект
  const project = {
    title: "AI marketing copilot",
    description: "AI-powered marketing assistant for solo founders",
    userId: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const projectResult = await db.collection("projects").insertOne(project);
  const projectId = projectResult.insertedId;
  console.log(`✅ Создан проект: ${project.title} (ID: ${projectId})`);
  
  // Создаем тестовую гипотезу
  const hypothesis = {
    title: "Solo founders",
    description: "Solo founders need AI-powered marketing tools to scale their business",
    projectId: projectId,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const hypothesisResult = await db.collection("projectHypotheses").insertOne(hypothesis);
  const hypothesisId = hypothesisResult.insertedId;
  console.log(`✅ Создана гипотеза: ${hypothesis.title} (ID: ${hypothesisId})`);
  
  // Создаем Lean Canvas
  const leanCanvas = {
    projectHypothesisId: hypothesisId,
    problems: [
      "Solo founders struggle with time management",
      "Limited marketing budget",
      "Lack of marketing expertise"
    ],
    solutions: [
      "AI-powered content generation",
      "Automated marketing workflows",
      "Personalized marketing strategies"
    ],
    uniqueValueProposition: "AI marketing copilot that helps solo founders scale their business without hiring a team",
    keyMetrics: ["User engagement", "Conversion rate", "ROI"],
    channels: ["Content marketing", "Social media", "Email marketing"],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.collection("hypothesesCores").insertOne(leanCanvas);
  console.log("✅ Создан Lean Canvas");
  
  // Создаем ICP Profile
  const icpProfile = {
    projectHypothesisId: hypothesisId,
    persona: "Solo Founder",
    userPains: [
      "Не хватает времени на маркетинг",
      "Ограниченный бюджет на рекламу",
      "Нет опыта в маркетинге",
      "Сложно масштабировать бизнес в одиночку"
    ],
    userGoals: [
      "Увеличить количество клиентов",
      "Автоматизировать маркетинг",
      "Масштабировать бизнес",
      "Повысить узнаваемость бренда"
    ],
    triggers: [
      "Рост конкуренции",
      "Необходимость масштабирования",
      "Желание автоматизировать процессы"
    ],
    objections: [
      "Слишком дорого",
      "Не уверен в эффективности AI",
      "Предпочитаю делать сам"
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await db.collection("hypothesesPersonProfiles").insertOne(icpProfile);
  console.log("✅ Создан ICP Profile");
  
  return { projectId: projectId.toString(), hypothesisId: hypothesisId.toString() };
}

async function runTest() {
  let projectId: string | null = null;
  let hypothesisId: string | null = null;
  
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    
    // Пытаемся найти существующий проект
    const projects = await db.collection("projects").find({}).toArray();
    console.log(`\n=== ПОИСК ПРОЕКТОВ ===`);
    console.log(`Найдено проектов: ${projects.length}`);
    
    if (projects.length > 0) {
      for (const project of projects) {
        const title = (project.title || "").toLowerCase();
        if (title.includes("ai marketing") || title.includes("marketing copilot")) {
          const hypotheses = await db.collection("projectHypotheses").find({ projectId: project._id }).toArray();
          for (const h of hypotheses) {
            const hTitle = (h.title || "").toLowerCase();
            if (hTitle.includes("solo") || hTitle.includes("founder")) {
              projectId = project._id.toString();
              hypothesisId = h._id.toString();
              console.log(`\n✅ НАЙДЕН ПРОЕКТ: ${project.title}`);
              console.log(`✅ НАЙДЕНА ГИПОТЕЗА: ${h.title}`);
              break;
            }
          }
          if (projectId) break;
        }
      }
    }
    
    // Если не нашли, создаем тестовые данные
    if (!projectId || !hypothesisId) {
      console.log("\n⚠️  Проект не найден, создаю тестовые данные...");
      const testData = await createTestData(db);
      projectId = testData.projectId;
      hypothesisId = testData.hypothesisId;
    }
    
    if (!projectId || !hypothesisId) {
      throw new Error("Не удалось получить или создать projectId и hypothesisId");
    }
    
    console.log("\n=== ИСПОЛЬЗУЮ ДАННЫЕ ===");
    console.log(`Project ID: ${projectId}`);
    console.log(`Hypothesis ID: ${hypothesisId}`);
    
    // Загружаем SEO контекст
    console.log("\n=== ЗАГРУЗКА SEO КОНТЕКСТА ===");
    const seoContext = await loadSeoContext(projectId, hypothesisId);
    
    console.log(`✅ Проект: ${seoContext.project?.title || "NOT FOUND"}`);
    console.log(`✅ Гипотеза: ${seoContext.hypothesis?.title || "NOT FOUND"}`);
    console.log(`✅ Язык: ${seoContext.language || "Russian (default)"}`);
    console.log(`✅ ICP: ${seoContext.icp ? "Найден" : "Не найден"}`);
    console.log(`✅ Lean Canvas: ${seoContext.leanCanvas ? "Найден" : "Не найден"}`);
    console.log(`✅ Clusters: ${seoContext.clusters.length}`);
    
    // Показываем контекст
    if (seoContext.icp) {
      console.log("\n=== ICP ДАННЫЕ ===");
      console.log(`Persona: ${seoContext.icp.persona || "Не указан"}`);
      const pains = Array.isArray(seoContext.icp.pains) ? seoContext.icp.pains : [];
      console.log(`Pains: ${pains.length}`);
      if (pains.length > 0) {
        console.log("Список болей:");
        pains.forEach((pain: any, i: number) => {
          console.log(`  ${i + 1}. ${pain}`);
        });
      }
    }
    
    if (seoContext.leanCanvas) {
      console.log("\n=== LEAN CANVAS ДАННЫЕ ===");
      const problems = Array.isArray(seoContext.leanCanvas.problems) ? seoContext.leanCanvas.problems : [];
      const solutions = Array.isArray(seoContext.leanCanvas.solutions) ? seoContext.leanCanvas.solutions : [];
      console.log(`Problems: ${problems.length}`);
      if (problems.length > 0) {
        problems.forEach((p: any, i: number) => {
          console.log(`  ${i + 1}. ${p}`);
        });
      }
      console.log(`Solutions: ${solutions.length}`);
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
    console.log(`Проект: ${seoContext.project?.title || "Unknown"}`);
    console.log(`Гипотеза: ${seoContext.hypothesis?.title || "Unknown"}\n`);
    
    let relevantCount = 0;
    let painMentions = 0;
    let soloFounderMentions = 0;
    let projectMentions = 0;
    
    generatedIdeas.forEach((idea, index) => {
      console.log(`\n${index + 1}. ${idea.title}`);
      console.log(`   Описание: ${idea.summary}`);
      
      const titleLower = idea.title.toLowerCase();
      const summaryLower = idea.summary.toLowerCase();
      
      const mentionsProject = titleLower.includes("marketing") || 
                             titleLower.includes("ai") ||
                             summaryLower.includes("marketing") ||
                             summaryLower.includes("ai");
      
      const mentionsSoloFounder = titleLower.includes("solo") ||
                                  (titleLower.includes("founder") && !titleLower.includes("co-founder")) ||
                                  titleLower.includes("основател") ||
                                  titleLower.includes("одиноч") ||
                                  summaryLower.includes("solo") ||
                                  (summaryLower.includes("founder") && !summaryLower.includes("co-founder")) ||
                                  summaryLower.includes("основател") ||
                                  summaryLower.includes("одиноч");
      
      // Проверка на упоминание болей - либо общие слова, либо конкретные боли из ICP
      let mentionsPain = titleLower.includes("проблем") ||
                        titleLower.includes("боль") ||
                        titleLower.includes("сложност") ||
                        titleLower.includes("трудност") ||
                        titleLower.includes("нехватк") ||
                        summaryLower.includes("проблем") ||
                        summaryLower.includes("боль") ||
                        summaryLower.includes("сложност") ||
                        summaryLower.includes("трудност") ||
                        summaryLower.includes("нехватк");
      
      // Проверка на упоминание конкретных болей из ICP
      if (seoContext.icp && Array.isArray(seoContext.icp.pains)) {
        for (const pain of seoContext.icp.pains) {
          const painStr = String(pain).toLowerCase();
          const painWords = painStr.split(/\s+/).filter(w => w.length > 3); // Слова длиннее 3 символов
          for (const word of painWords) {
            if (titleLower.includes(word) || summaryLower.includes(word)) {
              mentionsPain = true;
              break;
            }
          }
          if (mentionsPain) break;
        }
      }
      
      if (mentionsProject) projectMentions++;
      if (mentionsSoloFounder) soloFounderMentions++;
      if (mentionsPain) painMentions++;
      if (mentionsProject || mentionsSoloFounder || mentionsPain) relevantCount++;
      
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
        }
      }
    });
    
    // Итоговая статистика
    console.log("\n=== ИТОГОВАЯ СТАТИСТИКА ===");
    console.log(`Всего идей: ${generatedIdeas.length}`);
    console.log(`Релевантных идей: ${relevantCount} (${Math.round((relevantCount / generatedIdeas.length) * 100)}%)`);
    console.log(`Упоминаний проекта: ${projectMentions}`);
    console.log(`Упоминаний Solo Founder: ${soloFounderMentions}`);
    console.log(`Упоминаний болей: ${painMentions}`);
    
    if (relevantCount / generatedIdeas.length >= 0.8) {
      console.log("\n✅ ТЕСТ ПРОЙДЕН: Большинство идей релевантны!");
    } else {
      console.log("\n⚠️  ТЕСТ ТРЕБУЕТ УЛУЧШЕНИЯ: Много нерелевантных идей");
    }
    
    await mongoose.connection.close();
    console.log("\n✅ Тест завершен успешно!");
    process.exit(0);
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
runTest();

