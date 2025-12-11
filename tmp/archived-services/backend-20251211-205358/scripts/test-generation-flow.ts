/**
 * Тест флоу генерации идей согласно GENERATION_FLOW_CHECK.md
 * Проверяет все этапы: валидацию, загрузку контекста, генерацию
 */

import mongoose from "mongoose";
import { loadSeoContext } from "../src/services/context/seoContext.js";
import { generateIdeasFromOpenAI } from "../src/services/contentIdeas/generator.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

// ID из документации
const PROJECT_ID = "686774b6773b5947fed60a78"; // AI marketing copilot
const HYPOTHESIS_ID = "687fe5363c4cca83a3cc578d"; // Solo founders
const USER_ID = "686773b5773b5947fed60a68"; // sigayyury5@gmail.com

async function testGenerationFlow() {
  console.log("=".repeat(80));
  console.log("ТЕСТ ФЛОУ ГЕНЕРАЦИИ ИДЕЙ");
  console.log("=".repeat(80));
  console.log(`Проект: AI marketing copilot (${PROJECT_ID})`);
  console.log(`Гипотеза: Solo founders (${HYPOTHESIS_ID})`);
  console.log(`Пользователь: ${USER_ID}\n`);

  try {
    // Подключение к БД
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI не установлен");
    }

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // ============================================
    // ЭТАП 1: Валидация входных параметров
    // ============================================
    console.log("📋 ЭТАП 1: Валидация входных параметров");
    console.log("-".repeat(80));
    
    if (!PROJECT_ID || !PROJECT_ID.trim()) {
      throw new Error("❌ projectId is required");
    }
    if (!HYPOTHESIS_ID || !HYPOTHESIS_ID.trim()) {
      throw new Error("❌ hypothesisId is required");
    }
    
    console.log("✅ projectId валиден:", PROJECT_ID);
    console.log("✅ hypothesisId валиден:", HYPOTHESIS_ID);
    console.log("");

    // ============================================
    // ЭТАП 2: Загрузка SEO контекста
    // ============================================
    console.log("📋 ЭТАП 2: Загрузка SEO контекста (loadSeoContext)");
    console.log("-".repeat(80));
    
    const seoContext = await loadSeoContext(PROJECT_ID, HYPOTHESIS_ID, USER_ID);
    
    console.log("✅ Контекст загружен:");
    console.log(`   Проект: ${seoContext.project?.title || "не найден"}`);
    console.log(`   Гипотеза: ${seoContext.hypothesis?.title || "не найдена"}`);
    console.log(`   Lean Canvas: ${seoContext.leanCanvas ? "найден" : "не найден"}`);
    console.log(`   ICP: ${seoContext.icp ? "найден" : "не найден"}`);
    console.log(`   Кластеры: ${seoContext.clusters.length} шт.`);
    console.log(`   Язык: ${seoContext.language || "не установлен (будет использован English по умолчанию)"}`);
    console.log("");

    // Проверка принадлежности гипотезы к проекту
    if (!seoContext.hypothesis) {
      throw new Error("❌ Гипотеза не найдена или не принадлежит проекту");
    }
    
    const hypothesisProjectId = typeof seoContext.hypothesis.projectId === 'object'
      ? seoContext.hypothesis.projectId.toString()
      : seoContext.hypothesis.projectId;
    
    if (hypothesisProjectId !== PROJECT_ID) {
      throw new Error(`❌ Гипотеза принадлежит другому проекту: ${hypothesisProjectId}`);
    }
    
    console.log("✅ Проверка принадлежности гипотезы к проекту пройдена");
    console.log("");

    // ============================================
    // ЭТАП 3: Генерация идей через OpenAI
    // ============================================
    console.log("📋 ЭТАП 3: Генерация идей через OpenAI");
    console.log("-".repeat(80));
    
    const language = seoContext.language || "English";
    console.log(`Используемый язык: ${language}`);
    
    // Генерируем идеи для одной категории (PAIN) для теста
    const category = "PAIN";
    const count = 3;
    
    console.log(`Генерирую ${count} идеи для категории: ${category}`);
    
    const generatedIdeas = await generateIdeasFromOpenAI({
      context: seoContext,
      category: category,
      count: count,
      language: language
    });
    
    console.log(`✅ Сгенерировано идей: ${generatedIdeas.length}`);
    generatedIdeas.forEach((idea, index) => {
      console.log(`   ${index + 1}. ${idea.title}`);
      if (idea.summary) {
        console.log(`      ${idea.summary.substring(0, 100)}...`);
      }
    });
    console.log("");

    // ============================================
    // ЭТАП 4: Проверка дубликатов и сохранение
    // ============================================
    console.log("📋 ЭТАП 4: Проверка дубликатов и сохранение");
    console.log("-".repeat(80));
    
    const { checkDuplicateIdea } = await import("../src/services/contentIdeas/generator.js");
    
    let savedCount = 0;
    let duplicateCount = 0;
    
    for (const idea of generatedIdeas) {
      const isDuplicate = await checkDuplicateIdea(
        PROJECT_ID,
        HYPOTHESIS_ID,
        idea.title,
        idea.summary
      );
      
      if (isDuplicate) {
        console.log(`⚠️  Дубликат пропущен: "${idea.title}"`);
        duplicateCount++;
        continue;
      }
      
      // Сохраняем идею
      try {
        const contentItem = await SeoContentItem.create({
          projectId: PROJECT_ID,
          hypothesisId: HYPOTHESIS_ID,
          title: idea.title,
          category: "pain",
          format: "blog",
          status: "draft",
          outline: idea.summary,
          createdBy: USER_ID,
          updatedBy: USER_ID
        });
        
        console.log(`✅ Сохранена идея: "${idea.title}" (ID: ${contentItem.id})`);
        savedCount++;
      } catch (error: any) {
        console.error(`❌ Ошибка сохранения идеи "${idea.title}":`, error.message);
      }
    }
    
    console.log("");
    console.log(`Итого: сохранено ${savedCount}, пропущено дубликатов ${duplicateCount}`);
    console.log("");

    // ============================================
    // ИТОГИ
    // ============================================
    console.log("=".repeat(80));
    console.log("✅ ТЕСТ ЗАВЕРШЕН УСПЕШНО");
    console.log("=".repeat(80));
    console.log(`✅ Валидация параметров: пройдена`);
    console.log(`✅ Загрузка контекста: успешно`);
    console.log(`✅ Проверка принадлежности гипотезы: пройдена`);
    console.log(`✅ Генерация идей: ${generatedIdeas.length} идей`);
    console.log(`✅ Сохранение: ${savedCount} идей сохранено`);
    console.log("=".repeat(80));

  } catch (error: any) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ ОШИБКА В ТЕСТЕ");
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

// Запуск теста
testGenerationFlow().catch(console.error);
