#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const targetProjectId = "686774b6773b5947fed60a78";
const targetHypothesisId = "687fe5363c4cca83a3cc578d";

async function linkArticlesToHypothesis() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection failed");
  }
  
  console.log("=".repeat(100));
  console.log("ПРИВЯЗКА СТАТЕЙ К ПРОЕКТУ И ГИПОТЕЗЕ");
  console.log("=".repeat(100));
  console.log(`\nЦелевой проект: ${targetProjectId}`);
  console.log(`Целевая гипотеза: ${targetHypothesisId}\n`);
  
  // Найти все идеи, которые не привязаны к целевому проекту/гипотезе
  const allIdeas = await SeoBacklogIdea.find({}).exec();
  
  console.log(`Всего идей в базе: ${allIdeas.length}\n`);
  
  // Группировка по projectId и hypothesisId
  const byProject = new Map<string, number>();
  const byHypothesis = new Map<string, number>();
  
  allIdeas.forEach(idea => {
    const projKey = idea.projectId || "NULL";
    const hypKey = idea.hypothesisId || "NULL";
    byProject.set(projKey, (byProject.get(projKey) || 0) + 1);
    byHypothesis.set(hypKey, (byHypothesis.get(hypKey) || 0) + 1);
  });
  
  console.log("Распределение по проектам:");
  Array.from(byProject.entries()).forEach(([proj, count]) => {
    console.log(`  ${proj}: ${count} идей`);
  });
  
  console.log("\nРаспределение по гипотезам:");
  Array.from(byHypothesis.entries()).forEach(([hyp, count]) => {
    console.log(`  ${hyp}: ${count} идей`);
  });
  
  // Найти идеи, которые нужно привязать
  const ideasToLink = allIdeas.filter(idea => 
    idea.projectId !== targetProjectId || idea.hypothesisId !== targetHypothesisId
  );
  
  console.log(`\n\nИдей для привязки: ${ideasToLink.length}`);
  
  if (ideasToLink.length === 0) {
    console.log("✅ Все идеи уже привязаны к целевому проекту и гипотезе");
    await mongoose.disconnect();
    return;
  }
  
  // Показать примеры
  console.log("\nПримеры идей для привязки:");
  ideasToLink.slice(0, 5).forEach((idea, idx) => {
    console.log(`\n${idx + 1}. ${idea.title}`);
    console.log(`   Текущий проект: ${idea.projectId || "NULL"}`);
    console.log(`   Текущая гипотеза: ${idea.hypothesisId || "NULL"}`);
    console.log(`   Категория: ${idea.category}`);
  });
  
  // Привязать все идеи
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("ПРИВЯЗКА ИДЕЙ...");
  console.log("=".repeat(100));
  
  let updated = 0;
  let errors = 0;
  
  for (const idea of ideasToLink) {
    try {
      idea.projectId = targetProjectId;
      idea.hypothesisId = targetHypothesisId;
      idea.updatedBy = "system";
      await idea.save();
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`  Привязано: ${updated}/${ideasToLink.length}...`);
      }
    } catch (error: any) {
      console.error(`  ❌ Ошибка при обновлении идеи ${idea._id}: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n✅ Привязано идей: ${updated}`);
  if (errors > 0) {
    console.log(`❌ Ошибок: ${errors}`);
  }
  
  // Проверить результат
  const finalCount = await SeoBacklogIdea.countDocuments({
    projectId: targetProjectId,
    hypothesisId: targetHypothesisId
  }).exec();
  
  console.log(`\n\nИтого идей привязано к проекту и гипотезе: ${finalCount}`);
  
  // Показать распределение по категориям
  const byCategory = new Map<string, number>();
  const linkedIdeas = await SeoBacklogIdea.find({
    projectId: targetProjectId,
    hypothesisId: targetHypothesisId
  }).exec();
  
  linkedIdeas.forEach(idea => {
    byCategory.set(idea.category, (byCategory.get(idea.category) || 0) + 1);
  });
  
  console.log("\nРаспределение по категориям после привязки:");
  Array.from(byCategory.entries()).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} идей`);
  });
  
  await mongoose.disconnect();
}

linkArticlesToHypothesis().catch(console.error);





