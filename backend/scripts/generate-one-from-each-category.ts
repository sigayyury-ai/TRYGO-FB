#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { generateContent } from "../src/services/contentGeneration.js";
import { config } from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";
const userId = "686773b5773b5947fed60a68";

const categories = ["pain", "goal", "trigger", "feature", "benefit", "faq", "info"] as const;

async function generateOneFromEachCategory() {
  await mongoose.connect(MONGODB_URI!);
  
  console.log("=".repeat(100));
  console.log("ГЕНЕРАЦИЯ ПО ОДНОЙ СТАТЬЕ ИЗ КАЖДОЙ КАТЕГОРИИ");
  console.log("=".repeat(100));
  
  const results: Array<{
    category: string;
    idea: any;
    success: boolean;
    content?: any;
    error?: string;
  }> = [];
  
  for (const category of categories) {
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`КАТЕГОРИЯ: ${category.toUpperCase()}`);
    console.log("=".repeat(100));
    
    // Найти одну идею из категории
    const idea = await SeoBacklogIdea.findOne({
      projectId,
      hypothesisId,
      category: category
    }).sort({ createdAt: -1 }).exec();
    
    if (!idea) {
      console.log(`❌ Идея не найдена для категории ${category}`);
      results.push({
        category,
        idea: null,
        success: false,
        error: `Идея не найдена для категории ${category}`
      });
      continue;
    }
    
    console.log(`\n📋 Найдена идея:`);
    console.log(`   Заголовок: ${idea.title}`);
    console.log(`   Описание: ${idea.description}`);
    console.log(`   ID: ${idea._id}`);
    
    try {
      console.log(`\n🔄 Генерирую контент...`);
      
      const contentResult = await generateContent({
        backlogIdeaId: idea._id.toString(),
        projectId,
        hypothesisId,
        userId,
        title: idea.title,
        description: idea.description,
        category: category.toLowerCase() as any,
        format: "blog" as any,
        language: "Russian"
      });
      
      console.log(`✅ Контент сгенерирован успешно!`);
      console.log(`   Объем: ${contentResult.content?.split(/\s+/).filter(w => w.length > 0).length || 0} слов`);
      console.log(`   Разделов: ${(contentResult.content?.match(/^##\s+/gm) || []).length || 0}`);
      
      results.push({
        category,
        idea: {
          id: idea._id.toString(),
          title: idea.title,
          description: idea.description
        },
        success: true,
        content: contentResult
      });
      
    } catch (error: any) {
      console.log(`❌ Ошибка при генерации: ${error.message}`);
      console.error(error);
      
      results.push({
        category,
        idea: {
          id: idea._id.toString(),
          title: idea.title,
          description: idea.description
        },
        success: false,
        error: error.message
      });
    }
  }
  
  // Сохранить результаты
  const outputDir = resolve(process.cwd(), "../logs");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = Date.now();
  const summaryFile = resolve(outputDir, `generation-by-category-summary-${timestamp}.txt`);
  const detailsFile = resolve(outputDir, `generation-by-category-details-${timestamp}.txt`);
  
  // Summary
  let summary = "=".repeat(100) + "\n";
  summary += "СВОДКА: ГЕНЕРАЦИЯ ПО ОДНОЙ СТАТЬЕ ИЗ КАЖДОЙ КАТЕГОРИИ\n";
  summary += "=".repeat(100) + "\n\n";
  
  summary += `Дата: ${new Date().toISOString()}\n`;
  summary += `Проект: ${projectId}\n`;
  summary += `Гипотеза: ${hypothesisId}\n\n`;
  
  summary += "РЕЗУЛЬТАТЫ:\n";
  summary += "-".repeat(100) + "\n";
  
  results.forEach((result, idx) => {
    summary += `\n${idx + 1}. ${result.category.toUpperCase()}\n`;
    if (result.idea) {
      summary += `   Идея: ${result.idea.title}\n`;
    }
    summary += `   Статус: ${result.success ? "✅ Успешно" : "❌ Ошибка"}\n`;
    if (result.error) {
      summary += `   Ошибка: ${result.error}\n`;
    }
    if (result.content) {
      const wordCount = result.content.content?.split(/\s+/).filter((w: string) => w.length > 0).length || 0;
      const sections = (result.content.content?.match(/^##\s+/gm) || []).length || 0;
      summary += `   Объем: ${wordCount} слов, ${sections} разделов\n`;
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  summary += `\n\nИТОГО:\n`;
  summary += `   Успешно: ${successCount}/${results.length}\n`;
  summary += `   Ошибок: ${failCount}/${results.length}\n`;
  
  fs.writeFileSync(summaryFile, summary, "utf-8");
  console.log(`\n\n✅ Сводка сохранена: ${summaryFile}`);
  
  // Details
  let details = "=".repeat(100) + "\n";
  details += "ДЕТАЛИ: ГЕНЕРАЦИЯ ПО ОДНОЙ СТАТЬЕ ИЗ КАЖДОЙ КАТЕГОРИИ\n";
  details += "=".repeat(100) + "\n\n";
  
  results.forEach((result, idx) => {
    details += `\n\n${"=".repeat(100)}\n`;
    details += `КАТЕГОРИЯ ${idx + 1}: ${result.category.toUpperCase()}\n`;
    details += "=".repeat(100) + "\n\n";
    
    if (result.idea) {
      details += `ИДЕЯ:\n`;
      details += `   ID: ${result.idea.id}\n`;
      details += `   Заголовок: ${result.idea.title}\n`;
      details += `   Описание: ${result.idea.description}\n\n`;
    }
    
    if (result.success && result.content) {
      details += `СТАТУС: ✅ Успешно\n\n`;
      details += `РЕЗУЛЬТАТ ГЕНЕРАЦИИ:\n`;
      details += "-".repeat(100) + "\n\n";
      
      if (result.content.content) {
        const wordCount = result.content.content.split(/\s+/).filter((w: string) => w.length > 0).length;
        const sections = (result.content.content.match(/^##\s+/gm) || []).length;
        
        details += `ОБЪЕМ: ${wordCount} слов\n`;
        details += `РАЗДЕЛОВ: ${sections}\n\n`;
        
        details += `ПОЛНЫЙ ТЕКСТ:\n`;
        details += "-".repeat(100) + "\n\n";
        details += result.content.content;
        details += `\n\n`;
      }
      
      if (result.content.outline) {
        details += `OUTLINE:\n`;
        details += JSON.stringify(result.content.outline, null, 2);
        details += `\n\n`;
      }
    } else {
      details += `СТАТУС: ❌ Ошибка\n\n`;
      if (result.error) {
        details += `ОШИБКА: ${result.error}\n\n`;
      }
    }
  });
  
  fs.writeFileSync(detailsFile, details, "utf-8");
  console.log(`✅ Детали сохранены: ${detailsFile}`);
  
  // Вывести краткую сводку в консоль
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("ИТОГОВАЯ СВОДКА");
  console.log("=".repeat(100));
  console.log(`\n✅ Успешно сгенерировано: ${successCount}/${results.length}`);
  console.log(`❌ Ошибок: ${failCount}/${results.length}`);
  
  results.forEach((result) => {
    if (result.success && result.content) {
      const wordCount = result.content.content?.split(/\s+/).filter((w: string) => w.length > 0).length || 0;
      console.log(`\n${result.category.toUpperCase()}: ${wordCount} слов`);
    } else {
      console.log(`\n${result.category.toUpperCase()}: ❌ ${result.error}`);
    }
  });
  
  await mongoose.disconnect();
}

generateOneFromEachCategory().catch(console.error);

