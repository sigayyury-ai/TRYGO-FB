#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const targetProjectId = "686774b6773b5947fed60a78";
const targetHypothesisId = "687fe5363c4cca83a3cc578d";

async function linkContentItemsToHypothesis() {
  await mongoose.connect(MONGODB_URI!);
  
  console.log("=".repeat(100));
  console.log("ПРИВЯЗКА СГЕНЕРИРОВАННЫХ СТАТЕЙ К ПРОЕКТУ И ГИПОТЕЗЕ");
  console.log("=".repeat(100));
  console.log(`\nЦелевой проект: ${targetProjectId}`);
  console.log(`Целевая гипотеза: ${targetHypothesisId}\n`);
  
  // Найти все статьи
  const allItems = await SeoContentItem.find({}).exec();
  
  console.log(`Всего статей в базе: ${allItems.length}\n`);
  
  // Группировка по projectId и hypothesisId
  const byProject = new Map<string, number>();
  const byHypothesis = new Map<string, number>();
  
  allItems.forEach(item => {
    const projKey = item.projectId?.toString() || "NULL";
    const hypKey = item.hypothesisId?.toString() || "NULL";
    byProject.set(projKey, (byProject.get(projKey) || 0) + 1);
    byHypothesis.set(hypKey, (byHypothesis.get(hypKey) || 0) + 1);
  });
  
  console.log("Распределение по проектам:");
  Array.from(byProject.entries()).forEach(([proj, count]) => {
    console.log(`  ${proj}: ${count} статей`);
  });
  
  console.log("\nРаспределение по гипотезам:");
  Array.from(byHypothesis.entries()).forEach(([hyp, count]) => {
    console.log(`  ${hyp}: ${count} статей`);
  });
  
  // Найти статьи, которые нужно привязать
  const itemsToLink = allItems.filter(item => {
    const projId = item.projectId?.toString();
    const hypId = item.hypothesisId?.toString();
    return projId !== targetProjectId || hypId !== targetHypothesisId;
  });
  
  console.log(`\n\nСтатей для привязки: ${itemsToLink.length}`);
  
  if (itemsToLink.length === 0) {
    console.log("✅ Все статьи уже привязаны к целевому проекту и гипотезе");
    await mongoose.disconnect();
    return;
  }
  
  // Показать примеры
  console.log("\nПримеры статей для привязки:");
  itemsToLink.slice(0, 5).forEach((item, idx) => {
    console.log(`\n${idx + 1}. ${item.title}`);
    console.log(`   Текущий проект: ${item.projectId?.toString() || "NULL"}`);
    console.log(`   Текущая гипотеза: ${item.hypothesisId?.toString() || "NULL"}`);
    console.log(`   Категория: ${item.category}`);
    console.log(`   Статус: ${item.status}`);
  });
  
  // Привязать все статьи
  console.log(`\n\n${"=".repeat(100)}`);
  console.log("ПРИВЯЗКА СТАТЕЙ...");
  console.log("=".repeat(100));
  
  let updated = 0;
  let errors = 0;
  
  for (const item of itemsToLink) {
    try {
      item.projectId = targetProjectId;
      item.hypothesisId = targetHypothesisId;
      item.updatedBy = "system";
      await item.save();
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`  Привязано: ${updated}/${itemsToLink.length}...`);
      }
    } catch (error: any) {
      console.error(`  ❌ Ошибка при обновлении статьи ${item._id}: ${error.message}`);
      errors++;
    }
  }
  
  console.log(`\n✅ Привязано статей: ${updated}`);
  if (errors > 0) {
    console.log(`❌ Ошибок: ${errors}`);
  }
  
  // Проверить результат
  const finalCount = await SeoContentItem.countDocuments({
    projectId: targetProjectId,
    hypothesisId: targetHypothesisId
  }).exec();
  
  console.log(`\n\nИтого статей привязано к проекту и гипотезе: ${finalCount}`);
  
  // Показать распределение по категориям
  const byCategory = new Map<string, number>();
  const linkedItems = await SeoContentItem.find({
    projectId: targetProjectId,
    hypothesisId: targetHypothesisId
  }).exec();
  
  linkedItems.forEach(item => {
    byCategory.set(item.category, (byCategory.get(item.category) || 0) + 1);
  });
  
  console.log("\nРаспределение по категориям после привязки:");
  Array.from(byCategory.entries()).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} статей`);
  });
  
  // Показать распределение по статусам
  const byStatus = new Map<string, number>();
  linkedItems.forEach(item => {
    byStatus.set(item.status, (byStatus.get(item.status) || 0) + 1);
  });
  
  console.log("\nРаспределение по статусам:");
  Array.from(byStatus.entries()).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} статей`);
  });
  
  await mongoose.disconnect();
}

linkContentItemsToHypothesis().catch(console.error);

