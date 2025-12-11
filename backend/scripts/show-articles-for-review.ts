#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";

async function showArticles() {
  await mongoose.connect(MONGODB_URI!);
  
  const items = await SeoContentItem.find({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).limit(5).exec();
  
  console.log("=".repeat(80));
  console.log("СТАТЬИ ДЛЯ ПРОСМОТРА");
  console.log("=".repeat(80));
  console.log(`\nВсего статей: ${items.length}\n`);
  
  const articlesText: string[] = [];
  
  items.forEach((item, idx) => {
    if (!item.content) return;
    
    const words = item.content.split(/\s+/).filter(w => w.length > 0).length;
    
    console.log(`\n${"=".repeat(80)}`);
    console.log(`СТАТЬЯ ${idx + 1} из ${items.length}`);
    console.log("=".repeat(80));
    console.log(`\nЗаголовок: ${item.title}`);
    console.log(`Объем: ${words} слов`);
    console.log(`ID: ${item._id}`);
    console.log(`\n${"=".repeat(80)}\n`);
    console.log(item.content);
    console.log(`\n${"=".repeat(80)}\n`);
    
    articlesText.push(`\n${"=".repeat(80)}\nСТАТЬЯ ${idx + 1}: ${item.title}\n${"=".repeat(80)}\n\n${item.content}\n`);
  });
  
  // Сохраняем в файл
  const logsDir = resolve(process.cwd(), "../logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const outputFile = resolve(logsDir, `pain-articles-review-${Date.now()}.txt`);
  fs.writeFileSync(outputFile, articlesText.join("\n\n"));
  console.log(`\n✅ Все статьи сохранены в файл: ${outputFile}`);
  
  await mongoose.disconnect();
}

showArticles();

