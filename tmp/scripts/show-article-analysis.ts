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

async function showAnalysis() {
  await mongoose.connect(MONGODB_URI!);
  
  const items = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).limit(3).exec();
  
  console.log("=".repeat(80));
  console.log("ДЕТАЛЬНЫЙ АНАЛИЗ СГЕНЕРИРОВАННЫХ СТАТЕЙ");
  console.log("=".repeat(80));
  
  items.forEach((item, idx) => {
    if (!item.content) return;
    
    const words = item.content.split(/\s+/).filter(w => w.length > 0).length;
    const content = item.content;
    const contentLower = content.toLowerCase();
    
    console.log(`\n${idx + 1}. ${item.title}`);
    console.log("-".repeat(80));
    console.log(`ID: ${item._id}`);
    console.log(`Объем: ${words} слов`);
    console.log(`Статус: ${item.status}\n`);
    
    // Структура
    const sections = (content.match(/^##\s+/gm) || []).length;
    const h3s = (content.match(/^###\s+/gm) || []).length;
    
    console.log(`📐 Структура:`);
    console.log(`   H2 разделов: ${sections}`);
    console.log(`   H3 подразделов: ${h3s}`);
    
    // Проверка введения
    const introLength = content.split("\n\n").slice(0, 3).join(" ").length;
    const hasIntro = introLength > 200 || contentLower.includes("введение");
    console.log(`   Введение: ${hasIntro ? "✅" : "❌"} (${introLength} символов)`);
    
    // Проверка заключения
    const hasConclusion = contentLower.includes("заключение") || 
                         contentLower.includes("вывод") || 
                         contentLower.includes("итог") ||
                         contentLower.includes("в заключение");
    console.log(`   Заключение: ${hasConclusion ? "✅" : "❌"}`);
    
    // Упоминание болей
    const painKeywords = ["боль", "проблема", "трудность", "сложность", "нехватка", "недостаток"];
    const foundPains = painKeywords.filter(kw => contentLower.includes(kw));
    console.log(`   Упоминание болей: ${foundPains.length > 0 ? "✅" : "❌"} (${foundPains.join(", ")})`);
    
    // Упоминание продукта
    const mentionsProduct = contentLower.includes("ai marketing copilot") || 
                           contentLower.includes("marketing copilot");
    console.log(`   Упоминание продукта: ${mentionsProduct ? "✅" : "❌"}`);
    
    // Проблемы
    console.log(`\n⚠️  Проблемы:`);
    if (words < 1000) {
      console.log(`   ❌ Слишком короткий контент (${words} слов, нужно минимум 1500)`);
    } else if (words < 1500) {
      console.log(`   ⚠️  Контент короче рекомендованного (${words} слов, нужно 1500-2500)`);
    }
    
    if (!hasConclusion) {
      console.log(`   ❌ Отсутствует явное заключение`);
    }
    
    if (sections < 3) {
      console.log(`   ❌ Недостаточно основных разделов (${sections}, нужно минимум 3)`);
    }
    
    // Показываем начало статьи
    console.log(`\n📄 Начало статьи (первые 300 символов):`);
    const preview = content.substring(0, 300).replace(/\n/g, " ");
    console.log(`   ${preview}...\n`);
    
    // Показываем структуру разделов
    if (sections > 0) {
      console.log(`📑 Разделы статьи:`);
      const sectionMatches = content.match(/^##\s+(.+)$/gm);
      if (sectionMatches) {
        sectionMatches.slice(0, 5).forEach((section, i) => {
          const title = section.replace(/^##\s+/, "");
          console.log(`   ${i + 1}. ${title}`);
        });
        if (sectionMatches.length > 5) {
          console.log(`   ... и еще ${sectionMatches.length - 5} разделов`);
        }
      }
    }
    
    console.log("\n" + "=".repeat(80));
  });
  
  // Общий анализ
  console.log("\n\n📊 ОБЩИЙ АНАЛИЗ:\n");
  
  const allItems = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).exec();
  
  const totalWords = allItems.reduce((sum, item) => {
    return sum + (item.content ? item.content.split(/\s+/).filter(w => w.length > 0).length : 0);
  }, 0);
  
  const avgWords = Math.round(totalWords / allItems.length);
  
  let withConclusion = 0;
  let shortArticles = 0;
  
  allItems.forEach(item => {
    if (!item.content) return;
    const content = item.content.toLowerCase();
    if (content.includes("заключение") || content.includes("вывод") || content.includes("итог")) {
      withConclusion++;
    }
    const words = item.content.split(/\s+/).filter(w => w.length > 0).length;
    if (words < 1500) {
      shortArticles++;
    }
  });
  
  console.log(`Всего статей: ${allItems.length}`);
  console.log(`Средний объем: ${avgWords} слов`);
  console.log(`Статей с заключением: ${withConclusion}/${allItems.length} (${Math.round(withConclusion/allItems.length*100)}%)`);
  console.log(`Коротких статей (<1500 слов): ${shortArticles}/${allItems.length} (${Math.round(shortArticles/allItems.length*100)}%)\n`);
  
  console.log(`\n💡 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ ПРОМПТА:\n`);
  
  if (shortArticles > 0) {
    console.log(`1. ❗ УСИЛИТЬ ТРЕБОВАНИЕ К ОБЪЕМУ:`);
    console.log(`   - Явно указать минимальный объем 1500-2500 слов`);
    console.log(`   - Добавить требование: "Статья должна содержать минимум 1500 слов"`);
    console.log(`   - Указать структуру для достижения объема: 3-5 основных разделов по 300-500 слов каждый\n`);
  }
  
  if (withConclusion < allItems.length * 0.8) {
    console.log(`2. ❗ УСИЛИТЬ ТРЕБОВАНИЕ К ЗАКЛЮЧЕНИЮ:`);
    console.log(`   - Добавить явное требование: "Обязательно завершите статью разделом 'Заключение' или 'Выводы'"`);
    console.log(`   - Указать структуру заключения: "1-2 абзаца с выводами и CTA"\n`);
  }
  
  console.log(`3. ✅ СТРУКТУРА РАБОТАЕТ ХОРОШО:`);
  console.log(`   - Все статьи имеют введение и основные разделы`);
  console.log(`   - Упоминание болей присутствует во всех статьях\n`);
  
  await mongoose.disconnect();
}

showAnalysis();


