#!/usr/bin/env tsx

/**
 * Скрипт для генерации идей категории PAIN, создания контента и анализа результатов
 * Использование: tsx backend/scripts/generate-and-analyze-pain-content.ts <projectId> <hypothesisId> [userId]
 */

import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { generateContent } from "../src/services/contentGeneration.js";
import { loadSeoContext } from "../src/services/context/seoContext.js";
import { generateIdeasFromOpenAI } from "../src/services/contentIdeas/generator.js";
import { buildDraftPrompt } from "../src/services/contentDrafts/buildDraftPrompt.js";
import { config } from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

// Используем правильные ID проектов sigayyury5@gmail.com
const projectId = process.argv[2] || "686774b6773b5947fed60a78"; // AI marketing copilot
const hypothesisId = process.argv[3] || ""; // Будет создана или найдена
// Используем тестовый аккаунт sigayyury5@gmail.com согласно памяти
const userId = process.argv[4] || "686773b5773b5947fed60a68"; // sigayyury5@gmail.com

interface AnalysisResult {
  ideaId: string;
  title: string;
  promptLength: number;
  contentLength: number;
  wordCount: number;
  hasIntroduction: boolean;
  hasMainSections: boolean;
  hasConclusion: boolean;
  mentionsPain: boolean;
  mentionsProduct: boolean;
  structureScore: number;
  issues: string[];
  strengths: string[];
}

async function generateAndAnalyze() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Подключено к MongoDB\n");

  try {
    // Проверяем существование проекта
    const db = mongoose.connection.db;
    const project = await db.collection("projects").findOne({ _id: new mongoose.Types.ObjectId(projectId) });
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    
    console.log(`Используем userId: ${userId} (sigayyury5@gmail.com)\n`);
    
    // Проверяем/создаем гипотезу если нужно
    let actualHypothesisId = hypothesisId;
    if (!actualHypothesisId) {
      const hypotheses = await db.collection("hypotheses").find({ projectId }).toArray();
      if (hypotheses.length > 0) {
        // Используем первую найденную гипотезу
        actualHypothesisId = hypotheses[0]._id.toString();
        console.log(`Используем гипотезу: ${hypotheses[0].title || "Без названия"} (${actualHypothesisId})\n`);
      } else {
        // Создаем гипотезу
        const newHypothesis = await db.collection("hypotheses").insertOne({
          projectId,
          title: "Solo founders",
          description: "Hypothesis for solo founders",
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        actualHypothesisId = newHypothesis.insertedId.toString();
        console.log(`Создана новая гипотеза: ${actualHypothesisId}\n`);
      }
    }
    
    // Шаг 1: Генерируем или находим идеи категории PAIN
    console.log("📝 Шаг 1: Поиск/генерация идей категории PAIN...\n");
    
    let painIdeas: any[] = [];
    
    // Проверяем существующие идеи в backlog
    const existingBacklogIdeas = await SeoBacklogIdea.find({
      projectId,
      hypothesisId: actualHypothesisId,
      category: "pain"
    }).exec();
    
    console.log(`Найдено идей в backlog: ${existingBacklogIdeas.length}`);
    
      // Если идей мало, генерируем новые
      if (existingBacklogIdeas.length < 10) {
        console.log("Генерируем новые идеи через OpenAI...");
        const seoContext = await loadSeoContext(projectId, actualHypothesisId, userId);
      
      let generatedIdeas: any[] = [];
      try {
        generatedIdeas = await generateIdeasFromOpenAI({
          context: seoContext,
          category: "PAIN",
          count: 15, // Генерируем 15 идей (меньше для избежания обрезки JSON)
          language: seoContext.language || "Russian"
        });
        console.log(`Сгенерировано ${generatedIdeas.length} новых идей`);
      } catch (error: any) {
        console.error(`Ошибка генерации идей: ${error.message}`);
        console.log("Продолжаем с существующими идеями или создаем тестовые...");
        // Создаем несколько тестовых идей для анализа
        generatedIdeas = [
          { title: "Проблема нехватки времени на маркетинг для основателей-одиночек", summary: "Как основатели-одиночки могут эффективно управлять временем для маркетинга" },
          { title: "Ограниченный бюджет на рекламу: стратегии оптимизации", summary: "Практические советы по оптимизации рекламного бюджета" },
          { title: "Недостаток опыта в маркетинге: как начать", summary: "Руководство для основателей без маркетингового опыта" }
        ];
      }
      
        // Сохраняем в backlog
        for (const idea of generatedIdeas) {
          const backlogIdea = await SeoBacklogIdea.create({
            projectId,
            hypothesisId: actualHypothesisId,
          title: idea.title,
          description: idea.summary || "",
          category: "pain",
          status: "backlog",
          createdBy: userId,
          updatedBy: userId
        });
        painIdeas.push(backlogIdea);
      }
    } else {
      painIdeas = existingBacklogIdeas;
    }
    
    console.log(`\n✅ Всего идей PAIN для обработки: ${painIdeas.length}\n`);
    
    // Шаг 2: Генерируем контент для каждой идеи
    console.log("🚀 Шаг 2: Генерация контента...\n");
    
    const analysisResults: AnalysisResult[] = [];
    const seoContext = await loadSeoContext(projectId, actualHypothesisId, userId);
    
    for (let i = 0; i < painIdeas.length; i++) {
      const idea = painIdeas[i];
      console.log(`[${i + 1}/${painIdeas.length}] Обработка: ${idea.title}`);
      
      try {
        // Получаем промпт, который будет использован
        const { prompt, detectedType } = buildDraftPrompt({
          context: seoContext,
          idea: idea,
          contentType: "article",
          language: seoContext.language || "Russian"
        });
        
        // Генерируем контент
        const generationResult = await generateContent({
          title: idea.title,
          description: idea.description,
          category: "pain",
          contentType: "article",
          backlogIdeaId: idea._id.toString(),
          projectId,
          hypothesisId: actualHypothesisId,
          userId
        });
        
        // Анализируем результат
        const analysis = analyzeContent(
          idea._id.toString(),
          idea.title,
          prompt,
          generationResult.content,
          seoContext
        );
        
        analysisResults.push(analysis);
        
        // Сохраняем контент в SeoContentItem
        await SeoContentItem.create({
          projectId,
          hypothesisId: actualHypothesisId,
          backlogIdeaId: idea._id.toString(),
          title: idea.title,
          category: "pain",
          format: "blog",
          status: "draft",
          content: generationResult.content,
          outline: generationResult.outline,
          createdBy: userId,
          updatedBy: userId
        });
        
        console.log(`  ✅ Сгенерировано: ${analysis.wordCount} слов, оценка структуры: ${analysis.structureScore}/10`);
        
      } catch (error: any) {
        console.error(`  ❌ Ошибка: ${error.message}`);
        analysisResults.push({
          ideaId: idea._id.toString(),
          title: idea.title,
          promptLength: 0,
          contentLength: 0,
          wordCount: 0,
          hasIntroduction: false,
          hasMainSections: false,
          hasConclusion: false,
          mentionsPain: false,
          mentionsProduct: false,
          structureScore: 0,
          issues: [`Ошибка генерации: ${error.message}`],
          strengths: []
        });
      }
      
      // Небольшая задержка между запросами
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Шаг 3: Анализ результатов
    console.log("\n\n📊 Шаг 3: Анализ результатов...\n");
    
    const report = generateAnalysisReport(analysisResults, seoContext);
    
    // Сохраняем отчет
    const reportPath = `logs/pain-content-analysis-${Date.now()}.md`;
    fs.writeFileSync(reportPath, report);
    
    console.log(report);
    console.log(`\n\n📄 Полный отчет сохранен в: ${reportPath}`);
    
  } catch (error: any) {
    console.error("❌ Критическая ошибка:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Отключено от MongoDB");
  }
}

function analyzeContent(
  ideaId: string,
  title: string,
  prompt: string,
  content: string,
  context: any
): AnalysisResult {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const contentLower = content.toLowerCase();
  
  // Проверка структуры
  const hasIntroduction = /^#\s+.*\n\n.*(?:введение|introduction|вступление)/i.test(content) ||
    content.split("\n\n").slice(0, 3).join(" ").length > 200;
  
  const hasMainSections = (content.match(/^##\s+/gm) || []).length >= 3;
  
  const hasConclusion = /(?:заключение|conclusion|вывод|итог)/i.test(content) ||
    content.includes("##") && content.split("##").length > 1;
  
  // Проверка упоминания болей
  const painKeywords = ["боль", "проблема", "трудность", "сложность", "нехватка", "pain", "problem", "issue", "challenge"];
  const mentionsPain = painKeywords.some(keyword => contentLower.includes(keyword));
  
  // Проверка упоминания продукта
  const projectTitle = context.project?.title || "";
  const mentionsProduct = projectTitle ? contentLower.includes(projectTitle.toLowerCase()) : false;
  
  // Оценка структуры (0-10)
  let structureScore = 0;
  if (hasIntroduction) structureScore += 3;
  if (hasMainSections) structureScore += 4;
  if (hasConclusion) structureScore += 2;
  if (wordCount >= 1500) structureScore += 1;
  
  // Выявление проблем
  const issues: string[] = [];
  const strengths: string[] = [];
  
  if (!hasIntroduction) issues.push("Отсутствует введение");
  else strengths.push("Есть введение");
  
  if (!hasMainSections) issues.push("Недостаточно основных разделов (нужно минимум 3)");
  else strengths.push(`Есть ${(content.match(/^##\s+/gm) || []).length} основных разделов`);
  
  if (!hasConclusion) issues.push("Отсутствует заключение");
  else strengths.push("Есть заключение");
  
  if (wordCount < 1000) issues.push(`Слишком короткий контент (${wordCount} слов, нужно минимум 1500)`);
  else if (wordCount < 1500) issues.push(`Контент короче рекомендованного (${wordCount} слов)`);
  else strengths.push(`Достаточный объем: ${wordCount} слов`);
  
  if (!mentionsPain) issues.push("Не упоминаются ключевые слова боли/проблемы");
  else strengths.push("Упоминаются ключевые слова боли/проблемы");
  
  if (mentionsProduct && contentLower.split(projectTitle.toLowerCase()).length > 3) {
    issues.push("Слишком частое упоминание продукта");
  }
  
  return {
    ideaId,
    title,
    promptLength: prompt.length,
    contentLength: content.length,
    wordCount,
    hasIntroduction,
    hasMainSections,
    hasConclusion,
    mentionsPain,
    mentionsProduct,
    structureScore,
    issues,
    strengths
  };
}

function generateAnalysisReport(results: AnalysisResult[], context: any): string {
  const total = results.length;
  const successful = results.filter(r => r.wordCount > 0).length;
  const avgWordCount = results.reduce((sum, r) => sum + r.wordCount, 0) / successful || 0;
  const avgStructureScore = results.reduce((sum, r) => sum + r.structureScore, 0) / total || 0;
  
  const hasIntroductionCount = results.filter(r => r.hasIntroduction).length;
  const hasMainSectionsCount = results.filter(r => r.hasMainSections).length;
  const hasConclusionCount = results.filter(r => r.hasConclusion).length;
  const mentionsPainCount = results.filter(r => r.mentionsPain).length;
  
  // Собираем все проблемы
  const allIssues: Record<string, number> = {};
  results.forEach(r => {
    r.issues.forEach(issue => {
      allIssues[issue] = (allIssues[issue] || 0) + 1;
    });
  });
  
  // Анализ промпта
  const samplePrompt = results.find(r => r.promptLength > 0)?.promptLength || 0;
  const avgPromptLength = results.reduce((sum, r) => sum + r.promptLength, 0) / results.filter(r => r.promptLength > 0).length || 0;
  
  let report = `# Анализ генерации контента категории PAIN\n\n`;
  report += `**Дата:** ${new Date().toLocaleString("ru-RU")}\n`;
  report += `**Проект:** ${context.project?.title || projectId}\n`;
  report += `**Гипотеза:** ${context.hypothesis?.title || hypothesisId}\n\n`;
  
  report += `## Общая статистика\n\n`;
  report += `- **Всего обработано:** ${total}\n`;
  report += `- **Успешно сгенерировано:** ${successful}\n`;
  report += `- **Средний объем:** ${Math.round(avgWordCount)} слов\n`;
  report += `- **Средняя оценка структуры:** ${avgStructureScore.toFixed(1)}/10\n\n`;
  
  report += `## Соответствие требованиям\n\n`;
  report += `- **Есть введение:** ${hasIntroductionCount}/${total} (${Math.round(hasIntroductionCount/total*100)}%)\n`;
  report += `- **Есть основные разделы (≥3):** ${hasMainSectionsCount}/${total} (${Math.round(hasMainSectionsCount/total*100)}%)\n`;
  report += `- **Есть заключение:** ${hasConclusionCount}/${total} (${Math.round(hasConclusionCount/total*100)}%)\n`;
  report += `- **Упоминаются боли/проблемы:** ${mentionsPainCount}/${total} (${Math.round(mentionsPainCount/total*100)}%)\n\n`;
  
  report += `## Частые проблемы\n\n`;
  const sortedIssues = Object.entries(allIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sortedIssues.forEach(([issue, count]) => {
    report += `- **${issue}:** ${count} раз (${Math.round(count/total*100)}%)\n`;
  });
  
  report += `\n## Анализ промпта\n\n`;
  report += `- **Средняя длина промпта:** ${Math.round(avgPromptLength)} символов\n`;
  report += `- **Длина промпта:** ${avgPromptLength > 5000 ? "✅ Достаточная" : "⚠️ Может быть недостаточной"}\n\n`;
  
  // Рекомендации по улучшению промпта
  report += `## Рекомендации по улучшению промпта\n\n`;
  
  if (hasIntroductionCount / total < 0.8) {
    report += `1. **Усилить требование к введению:** Добавить явное требование начинать статью с введения (2-3 абзаца, 150-250 слов)\n`;
  }
  
  if (hasMainSectionsCount / total < 0.8) {
    report += `2. **Усилить требование к структуре:** Явно указать минимум 3-5 основных разделов с H2 заголовками, каждый по 300-500 слов\n`;
  }
  
  if (hasConclusionCount / total < 0.8) {
    report += `3. **Усилить требование к заключению:** Добавить явное требование завершать статью заключением с выводами и CTA\n`;
  }
  
  if (mentionsPainCount / total < 0.9) {
    report += `4. **Усилить фокус на боли:** Добавить требование обязательно использовать ключевые слова боли/проблемы из ICP в тексте\n`;
  }
  
  if (avgWordCount < 1500) {
    report += `5. **Усилить требование к объему:** Явно указать минимальный объем 1500-2500 слов и структуру для достижения этого объема\n`;
  }
  
  if (avgStructureScore < 7) {
    report += `6. **Добавить примеры структуры:** Включить в промпт примеры правильной структуры статьи с конкретными заголовками\n`;
  }
  
  // Детальный анализ по статьям
  report += `\n## Детальный анализ по статьям\n\n`;
  results.forEach((result, index) => {
    report += `### ${index + 1}. ${result.title}\n\n`;
    report += `- **Объем:** ${result.wordCount} слов\n`;
    report += `- **Оценка структуры:** ${result.structureScore}/10\n`;
    report += `- **Введение:** ${result.hasIntroduction ? "✅" : "❌"}\n`;
    report += `- **Основные разделы:** ${result.hasMainSections ? "✅" : "❌"}\n`;
    report += `- **Заключение:** ${result.hasConclusion ? "✅" : "❌"}\n`;
    report += `- **Упоминание боли:** ${result.mentionsPain ? "✅" : "❌"}\n`;
    
    if (result.issues.length > 0) {
      report += `\n**Проблемы:**\n`;
      result.issues.forEach(issue => report += `- ${issue}\n`);
    }
    
    if (result.strengths.length > 0) {
      report += `\n**Сильные стороны:**\n`;
      result.strengths.forEach(strength => report += `- ${strength}\n`);
    }
    
    report += `\n---\n\n`;
  });
  
  return report;
}

generateAndAnalyze().catch(console.error);

