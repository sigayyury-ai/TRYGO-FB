#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";
const userId = "686773b5773b5947fed60a68";

async function createIdeasFromContentItems() {
  await mongoose.connect(MONGODB_URI!);
  
  console.log("=".repeat(100));
  console.log("СОЗДАНИЕ ИДЕЙ ИЗ СУЩЕСТВУЮЩИХ СТАТЕЙ");
  console.log("=".repeat(100));
  
  // Найти статьи по категориям
  const categories = ["goal", "trigger", "feature", "benefit", "faq", "info"];
  
  let totalCreated = 0;
  
  for (const category of categories) {
    console.log(`\n\n${"=".repeat(100)}`);
    console.log(`КАТЕГОРИЯ: ${category.toUpperCase()}`);
    console.log("=".repeat(100));
    
    // Проверить, есть ли уже идеи для этой категории
    const existingIdeas = await SeoBacklogIdea.countDocuments({
      projectId,
      hypothesisId,
      category
    }).exec();
    
    if (existingIdeas > 0) {
      console.log(`✅ Уже есть ${existingIdeas} идей для категории ${category}`);
      continue;
    }
    
    // Найти одну статью из этой категории
    const article = await SeoContentItem.findOne({
      projectId,
      hypothesisId,
      category
    }).exec();
    
    if (!article) {
      console.log(`❌ Нет статей для категории ${category}`);
      continue;
    }
    
    console.log(`📄 Найдена статья: ${article.title}`);
    
    // Создать идею на основе статьи
    try {
      const idea = new SeoBacklogIdea({
        projectId,
        hypothesisId,
        title: article.title,
        description: article.outline || article.title,
        category: category as any,
        status: "backlog",
        createdBy: userId,
        updatedBy: userId
      });
      
      await idea.save();
      console.log(`✅ Создана идея: ${idea.title}`);
      totalCreated++;
    } catch (error: any) {
      console.error(`❌ Ошибка при создании идеи: ${error.message}`);
    }
  }
  
  console.log(`\n\n${"=".repeat(100)}`);
  console.log(`ИТОГО: Создано ${totalCreated} новых идей`);
  
  // Показать итоговое распределение
  const allIdeas = await SeoBacklogIdea.find({ projectId, hypothesisId }).exec();
  const byCategory = new Map<string, number>();
  allIdeas.forEach(idea => {
    byCategory.set(idea.category, (byCategory.get(idea.category) || 0) + 1);
  });
  
  console.log("\nРаспределение идей по категориям:");
  Array.from(byCategory.entries()).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} идей`);
  });
  
  await mongoose.disconnect();
}

createIdeasFromContentItems().catch(console.error);





