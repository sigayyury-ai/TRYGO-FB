#!/usr/bin/env tsx

/**
 * Проверка структуры данных: проекты, гипотезы, контент
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const userId = "686773b5773b5947fed60a68";
const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";

async function verifyStructure() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  console.log("=== ПРОВЕРКА СТРУКТУРЫ ДАННЫХ ===\n");
  
  // 1. Проверяем проект
  console.log("1. ПРОЕКТ:");
  const project = await db.collection("projects").findOne({ 
    _id: new mongoose.Types.ObjectId(projectId) 
  });
  
  if (project) {
    console.log(`   ✅ Найден: ${project.title}`);
    console.log(`   ID: ${project._id}`);
    console.log(`   userId: ${project.userId} (тип: ${typeof project.userId})`);
    const projUserId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    if (projUserId === userId) {
      console.log(`   ✅ userId совпадает с ожидаемым`);
    } else {
      console.log(`   ❌ userId не совпадает (ожидается: ${userId})`);
    }
  } else {
    console.log(`   ❌ Проект не найден`);
  }
  
  // 2. Проверяем гипотезу
  console.log("\n2. ГИПОТЕЗА:");
  const hypothesis = await db.collection("projectHypotheses").findOne({ 
    _id: new mongoose.Types.ObjectId(hypothesisId) 
  });
  
  if (hypothesis) {
    console.log(`   ✅ Найдена: ${hypothesis.title}`);
    console.log(`   ID: ${hypothesis._id}`);
    console.log(`   projectId: ${hypothesis.projectId} (тип: ${hypothesis.projectId.constructor.name})`);
    console.log(`   userId: ${hypothesis.userId}`);
    
    // Проверяем связь с проектом
    const hypProjectId = typeof hypothesis.projectId === 'object' 
      ? hypothesis.projectId.toString() 
      : hypothesis.projectId;
    
    if (hypProjectId === projectId) {
      console.log(`   ✅ projectId совпадает с ID проекта`);
    } else {
      console.log(`   ❌ projectId не совпадает (ожидается: ${projectId}, получено: ${hypProjectId})`);
    }
  } else {
    console.log(`   ❌ Гипотеза не найдена в projectHypotheses`);
    
    // Проверяем другие коллекции
    for (const coll of ['projecthypotheses', 'hypotheses']) {
      const hyp = await db.collection(coll).findOne({ 
        _id: new mongoose.Types.ObjectId(hypothesisId) 
      }).catch(() => null);
      if (hyp) {
        console.log(`   ⚠️  Найдена в коллекции ${coll} (неправильная!)`);
      }
    }
  }
  
  // 3. Проверяем контент
  console.log("\n3. КОНТЕНТ:");
  const { SeoContentItem } = await import("../src/db/models/SeoContentItem.js");
  const contentCount = await SeoContentItem.countDocuments({ 
    projectId, 
    hypothesisId 
  });
  console.log(`   Найдено единиц контента: ${contentCount}`);
  
  // 4. Проверяем backlog ideas
  console.log("\n4. BACKLOG IDEAS:");
  const { SeoBacklogIdea } = await import("../src/db/models/SeoBacklogIdea.js");
  const backlogCount = await SeoBacklogIdea.countDocuments({ 
    projectId, 
    hypothesisId 
  });
  console.log(`   Найдено идей: ${backlogCount}`);
  
  // 5. Тест загрузки через loadSeoContext
  console.log("\n5. ТЕСТ loadSeoContext:");
  try {
    const { loadSeoContext } = await import("../src/services/context/seoContext.js");
    const context = await loadSeoContext(projectId, hypothesisId, userId);
    
    console.log(`   ✅ Контекст загружен успешно`);
    console.log(`   Проект: ${context.project?.title || "не найден"}`);
    console.log(`   Гипотеза: ${context.hypothesis?.title || "не найдена"}`);
    console.log(`   Lean Canvas: ${context.leanCanvas ? "найден" : "не найден"}`);
    console.log(`   ICP: ${context.icp ? "найден" : "не найден"}`);
    console.log(`   Кластеры: ${context.clusters?.length || 0}`);
  } catch (error: any) {
    console.log(`   ❌ Ошибка загрузки: ${error.message}`);
  }
  
  await mongoose.disconnect();
  console.log("\n✅ Проверка завершена!");
}

verifyStructure();


