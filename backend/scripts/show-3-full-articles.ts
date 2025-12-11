#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";

async function show3FullArticles() {
  await mongoose.connect(MONGODB_URI!);
  
  const items = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).limit(3).exec();
  
  console.log("=".repeat(100));
  console.log("ПОЛНЫЕ ТЕКСТЫ 3 СТАТЕЙ ДЛЯ ПРОВЕРКИ СТРУКТУРЫ, ПРОДУКТА И CTA");
  console.log("=".repeat(100));
  
  items.forEach((item, idx) => {
    if (!item.content) return;
    
    const words = item.content.split(/\s+/).filter(w => w.length > 0).length;
    const content = item.content;
    const contentLower = content.toLowerCase();
    
    // Анализ структуры
    const sections = (content.match(/^##\s+/gm) || []).length;
    const h3s = (content.match(/^###\s+/gm) || []).length;
    
    // Проверка продукта
    const productMentions = [
      contentLower.match(/ai marketing copilot/g)?.length || 0,
      contentLower.match(/marketing copilot/g)?.length || 0
    ];
    const totalProductMentions = productMentions[0] + productMentions[1];
    
    // Проверка CTA
    const hasExplicitCTA = contentLower.includes("призыв") || 
                          contentLower.includes("cta") ||
                          contentLower.includes("call to action") ||
                          contentLower.includes("начните") ||
                          contentLower.includes("узнайте") ||
                          contentLower.includes("попробуйте") ||
                          contentLower.includes("изучите");
    
    const hasConclusion = contentLower.includes("заключение") || 
                         contentLower.includes("вывод") || 
                         contentLower.includes("итог");
    
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`СТАТЬЯ ${idx + 1} из ${items.length}`);
    console.log("=".repeat(100));
    console.log(`\n📌 ЗАГОЛОВОК: ${item.title}`);
    console.log(`📊 Объем: ${words} слов`);
    console.log(`📐 Структура: ${sections} разделов H2, ${h3s} подразделов H3`);
    console.log(`🔗 Упоминаний продукта: ${totalProductMentions}`);
    console.log(`📢 Есть CTA: ${hasExplicitCTA ? "✅" : "❌"}`);
    console.log(`📝 Есть заключение: ${hasConclusion ? "✅" : "❌"}`);
    console.log(`\n${"=".repeat(100)}\n`);
    
    // Показываем полный текст
    console.log(content);
    
    // Детальный анализ
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`АНАЛИЗ СТАТЬИ ${idx + 1}`);
    console.log("=".repeat(100));
    
    // Структура разделов
    const sectionMatches = content.match(/^##\s+(.+)$/gm);
    if (sectionMatches) {
      console.log(`\n📑 РАЗДЕЛЫ СТАТЬИ (${sectionMatches.length}):`);
      sectionMatches.forEach((section, i) => {
        const title = section.replace(/^##\s+/, "");
        console.log(`   ${i + 1}. ${title}`);
      });
    }
    
    // Упоминания продукта
    console.log(`\n🔗 УПОМИНАНИЯ ПРОДУКТА:`);
    if (totalProductMentions > 0) {
      const productRegex = /(ai marketing copilot|marketing copilot)/gi;
      const matches = content.match(productRegex);
      if (matches) {
        console.log(`   Найдено упоминаний: ${matches.length}`);
        // Показываем контекст упоминаний
        const lines = content.split('\n');
        lines.forEach((line, lineNum) => {
          if (productRegex.test(line)) {
            const context = line.trim().substring(0, 150);
            console.log(`   Строка ${lineNum + 1}: ${context}...`);
          }
        });
      }
    } else {
      console.log(`   ❌ Продукт не упоминается`);
    }
    
    // CTA
    console.log(`\n📢 CTA (Призыв к действию):`);
    if (hasExplicitCTA) {
      // Ищем последние абзацы как потенциальный CTA
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      const lastParagraphs = paragraphs.slice(-3);
      console.log(`   ✅ Найдены признаки CTA в последних абзацах:`);
      lastParagraphs.forEach((p, i) => {
        if (p.length > 20 && p.length < 500) {
          console.log(`   ${i + 1}. ${p.trim().substring(0, 200)}...`);
        }
      });
    } else {
      console.log(`   ❌ Явный CTA не обнаружен`);
      // Показываем последние строки
      const lastLines = content.split('\n').slice(-5).filter(l => l.trim().length > 0);
      console.log(`   Последние строки статьи:`);
      lastLines.forEach((line, i) => {
        console.log(`   ${i + 1}. ${line.trim()}`);
      });
    }
    
    // Заключение
    console.log(`\n📝 ЗАКЛЮЧЕНИЕ:`);
    if (hasConclusion) {
      const conclusionMatch = content.match(/##\s*(заключение|вывод|итог|в заключение).*?\n\n(.*?)(?=\n##|$)/is);
      if (conclusionMatch) {
        console.log(`   ✅ Найдено заключение:`);
        console.log(`   ${conclusionMatch[2].trim().substring(0, 300)}...`);
      } else {
        console.log(`   ⚠️  Упоминается, но не выделено отдельным разделом`);
      }
    } else {
      console.log(`   ❌ Явное заключение отсутствует`);
      console.log(`   Последний раздел: ${sectionMatches?.[sectionMatches.length - 1]?.replace(/^##\s+/, "") || "не найден"}`);
    }
    
    console.log(`\n${"=".repeat(100)}\n`);
  });
  
  await mongoose.disconnect();
}

show3FullArticles();

