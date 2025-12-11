#!/usr/bin/env tsx

/**
 * Исправление гипотезы - перемещение в правильную коллекцию и исправление projectId
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";
const userId = "686773b5773b5947fed60a68";

async function fixHypothesis() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  console.log("=== ИСПРАВЛЕНИЕ ГИПОТЕЗЫ ===\n");
  
  // Проверяем, где находится гипотеза
  const collections = ['projecthypotheses', 'projectHypotheses', 'hypotheses'];
  
  let foundHyp = null;
  let foundCollection = null;
  
  for (const collName of collections) {
    try {
      const hyp = await db.collection(collName).findOne({ 
        _id: new mongoose.Types.ObjectId(hypothesisId) 
      });
      if (hyp) {
        foundHyp = hyp;
        foundCollection = collName;
        console.log(`✅ Найдена гипотеза в коллекции: ${collName}`);
        break;
      }
    } catch (e) {
      // Коллекция не существует
    }
  }
  
  if (!foundHyp) {
    console.log("❌ Гипотеза не найдена ни в одной коллекции");
    await mongoose.disconnect();
    return;
  }
  
  console.log(`Текущая структура:`);
  console.log(`  projectId: ${foundHyp.projectId} (тип: ${typeof foundHyp.projectId})`);
  console.log(`  title: ${foundHyp.title}`);
  console.log(`  userId: ${foundHyp.userId}\n`);
  
  // Правильная структура согласно ProjectHypothesisModel
  const correctHyp = {
    _id: new mongoose.Types.ObjectId(hypothesisId),
    userId: new mongoose.Types.ObjectId(userId),
    projectId: new mongoose.Types.ObjectId(projectId), // ObjectId, не строка!
    title: foundHyp.title || "Solo founders",
    description: foundHyp.description || "Hypothesis for solo founders",
    createdAt: foundHyp.createdAt || new Date(),
    updatedAt: new Date()
  };
  
  // Удаляем из неправильной коллекции
  if (foundCollection !== "projectHypotheses") {
    await db.collection(foundCollection).deleteOne({ 
      _id: new mongoose.Types.ObjectId(hypothesisId) 
    });
    console.log(`✅ Удалена из неправильной коллекции: ${foundCollection}`);
  }
  
  // Проверяем, есть ли уже в правильной коллекции
  const existing = await db.collection("projectHypotheses").findOne({ 
    _id: new mongoose.Types.ObjectId(hypothesisId) 
  });
  
  if (existing) {
    // Обновляем существующую
    await db.collection("projectHypotheses").updateOne(
      { _id: new mongoose.Types.ObjectId(hypothesisId) },
      { 
        $set: {
          userId: correctHyp.userId,
          projectId: correctHyp.projectId,
          title: correctHyp.title,
          description: correctHyp.description,
          updatedAt: correctHyp.updatedAt
        }
      }
    );
    console.log(`✅ Обновлена гипотеза в коллекции projectHypotheses`);
  } else {
    // Создаем новую
    await db.collection("projectHypotheses").insertOne(correctHyp);
    console.log(`✅ Создана гипотеза в коллекции projectHypotheses`);
  }
  
  // Проверяем результат
  const finalHyp = await db.collection("projectHypotheses").findOne({ 
    _id: new mongoose.Types.ObjectId(hypothesisId) 
  });
  
  console.log(`\n=== ПРОВЕРКА РЕЗУЛЬТАТА ===`);
  if (finalHyp) {
    console.log(`✅ Гипотеза найдена в projectHypotheses:`);
    console.log(`   ID: ${finalHyp._id}`);
    console.log(`   projectId: ${finalHyp.projectId} (тип: ${finalHyp.projectId.constructor.name})`);
    console.log(`   userId: ${finalHyp.userId}`);
    console.log(`   title: ${finalHyp.title}`);
    
    // Проверяем связь с проектом
    const project = await db.collection("projects").findOne({ 
      _id: new mongoose.Types.ObjectId(projectId) 
    });
    
    if (project) {
      const hypProjectId = typeof finalHyp.projectId === 'object' 
        ? finalHyp.projectId.toString() 
        : finalHyp.projectId;
      const projId = project._id.toString();
      
      if (hypProjectId === projId) {
        console.log(`\n✅ Связь с проектом корректна!`);
      } else {
        console.log(`\n❌ Проблема со связью: projectId гипотезы (${hypProjectId}) != ID проекта (${projId})`);
      }
    }
  } else {
    console.log(`❌ Гипотеза не найдена после исправления`);
  }
  
  await mongoose.disconnect();
  console.log("\n✅ Готово!");
}

fixHypothesis();


