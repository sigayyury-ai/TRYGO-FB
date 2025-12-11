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

async function checkResults() {
  await mongoose.connect(MONGODB_URI!);
  
  const items = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).exec();
  
  console.log(`\n📊 РЕЗУЛЬТАТЫ ГЕНЕРАЦИИ КОНТЕНТА КАТЕГОРИИ PAIN\n`);
  console.log(`Всего сгенерировано: ${items.length}\n`);
  
  if (items.length === 0) {
    console.log("Статьи еще не сгенерированы или процесс не завершен.");
    await mongoose.disconnect();
    return;
  }
  
  // Статистика
  const totalWords = items.reduce((sum, item) => {
    const words = item.content ? item.content.split(/\s+/).filter(w => w.length > 0).length : 0;
    return sum + words;
  }, 0);
  
  const avgWords = Math.round(totalWords / items.length);
  
  console.log(`📈 Статистика:`);
  console.log(`   Средний объем: ${avgWords} слов`);
  console.log(`   Общий объем: ${totalWords} слов\n`);
  
  // Анализ структуры
  let withIntroduction = 0;
  let withSections = 0;
  let withConclusion = 0;
  let mentionsPain = 0;
  
  items.forEach(item => {
    if (!item.content) return;
    
    const content = item.content.toLowerCase();
    
    // Проверка введения
    if (content.includes("введение") || content.split("\n\n").slice(0, 3).join(" ").length > 200) {
      withIntroduction++;
    }
    
    // Проверка разделов
    const sections = (item.content.match(/^##\s+/gm) || []).length;
    if (sections >= 3) {
      withSections++;
    }
    
    // Проверка заключения
    if (content.includes("заключение") || content.includes("вывод") || content.includes("итог")) {
      withConclusion++;
    }
    
    // Проверка упоминания боли
    const painKeywords = ["боль", "проблема", "трудность", "сложность", "нехватка"];
    if (painKeywords.some(kw => content.includes(kw))) {
      mentionsPain++;
    }
  });
  
  console.log(`📋 Соответствие требованиям:`);
  console.log(`   Есть введение: ${withIntroduction}/${items.length} (${Math.round(withIntroduction/items.length*100)}%)`);
  console.log(`   Есть разделы (≥3): ${withSections}/${items.length} (${Math.round(withSections/items.length*100)}%)`);
  console.log(`   Есть заключение: ${withConclusion}/${items.length} (${Math.round(withConclusion/items.length*100)}%)`);
  console.log(`   Упоминаются боли: ${mentionsPain}/${items.length} (${Math.round(mentionsPain/items.length*100)}%)\n`);
  
  // Показываем примеры
  console.log(`📝 Примеры статей (первые 5):\n`);
  items.slice(0, 5).forEach((item, i) => {
    const words = item.content ? item.content.split(/\s+/).filter(w => w.length > 0).length : 0;
    const sections = item.content ? (item.content.match(/^##\s+/gm) || []).length : 0;
    
    console.log(`${i + 1}. ${item.title}`);
    console.log(`   Объем: ${words} слов`);
    console.log(`   Разделов: ${sections}`);
    console.log(`   Статус: ${item.status}`);
    console.log(`   ID: ${item._id}`);
    console.log("");
  });
  
  await mongoose.disconnect();
}

checkResults();


