#!/usr/bin/env tsx

/**
 * Копирование Lean Canvas и ICP к гипотезам проекта
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";

// Источник - существующие Lean Canvas и ICP
const sourceLeanCanvasId = "69387a92ef08390214f0241a";
const sourceICPId = "69387a92ef08390214f0241b";

const hypotheses = [
  { id: "686774c1773b5947fed60a7a", title: "Marketing Managers" },
  { id: "687b474d3c4cca83a3cc428e", title: "indi developers" },
  { id: "687fe5363c4cca83a3cc578d", title: "Solo founders" },
  { id: "68ac39d555525306f9486057", title: "Product owners" },
  { id: "68ac3abe55525306f9486097", title: "Product managers" },
  { id: "68ac5ae755525306f948612b", title: "BDM" }
];

async function copyLeanCanvasAndICP() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  
  console.log("=== КОПИРОВАНИЕ LEAN CANVAS И ICP ===\n");
  
  // Загружаем исходные данные
  const sourceLeanCanvas = await db.collection("hypothesesCores").findOne({
    _id: new mongoose.Types.ObjectId(sourceLeanCanvasId)
  });
  
  const sourceICP = await db.collection("hypothesesPersonProfiles").findOne({
    _id: new mongoose.Types.ObjectId(sourceICPId)
  });
  
  if (!sourceLeanCanvas) {
    console.error("❌ Исходный Lean Canvas не найден!");
    await mongoose.disconnect();
    return;
  }
  
  if (!sourceICP) {
    console.error("❌ Исходный ICP не найден!");
    await mongoose.disconnect();
    return;
  }
  
  console.log("✅ Исходные данные загружены\n");
  
  for (const hyp of hypotheses) {
    try {
      const hypothesisId = new mongoose.Types.ObjectId(hyp.id);
      
      console.log(`Обработка: ${hyp.title} (${hyp.id})`);
      
      // Проверяем, есть ли уже Lean Canvas
      let existingLeanCanvas = await db.collection("hypothesesCores").findOne({
        projectHypothesisId: hypothesisId
      });
      
      if (existingLeanCanvas) {
        console.log(`  ✅ Lean Canvas уже существует`);
      } else {
        // Копируем Lean Canvas
        const leanCanvasCopy = { ...sourceLeanCanvas };
        delete leanCanvasCopy._id;
        leanCanvasCopy.projectHypothesisId = hypothesisId;
        leanCanvasCopy.projectId = projectObjectId;
        leanCanvasCopy.createdAt = new Date();
        leanCanvasCopy.updatedAt = new Date();
        
        await db.collection("hypothesesCores").insertOne(leanCanvasCopy);
        console.log(`  ✅ Lean Canvas скопирован`);
      }
      
      // Проверяем, есть ли уже ICP
      let existingICP = await db.collection("hypothesesPersonProfiles").findOne({
        projectHypothesisId: hypothesisId
      });
      
      if (existingICP) {
        console.log(`  ✅ ICP уже существует`);
      } else {
        // Копируем ICP
        const icpCopy = { ...sourceICP };
        delete icpCopy._id;
        icpCopy.projectHypothesisId = hypothesisId;
        icpCopy.projectId = projectObjectId;
        icpCopy.createdAt = new Date();
        icpCopy.updatedAt = new Date();
        
        // Обновляем persona в зависимости от гипотезы
        if (icpCopy.persona || icpCopy.personaName) {
          icpCopy.persona = hyp.title;
          icpCopy.personaName = hyp.title;
        }
        
        await db.collection("hypothesesPersonProfiles").insertOne(icpCopy);
        console.log(`  ✅ ICP скопирован (persona: ${hyp.title})`);
      }
      
      console.log("");
      
    } catch (error: any) {
      console.error(`  ❌ Ошибка: ${error.message}\n`);
    }
  }
  
  // Проверяем результат
  console.log("\n=== ПРОВЕРКА РЕЗУЛЬТАТА ===");
  for (const hyp of hypotheses) {
    const hypothesisId = new mongoose.Types.ObjectId(hyp.id);
    
    const leanCanvas = await db.collection("hypothesesCores").findOne({
      projectHypothesisId: hypothesisId
    });
    
    const icp = await db.collection("hypothesesPersonProfiles").findOne({
      projectHypothesisId: hypothesisId
    });
    
    console.log(`${hyp.title}:`);
    console.log(`  Lean Canvas: ${leanCanvas ? "✅" : "❌"}`);
    console.log(`  ICP: ${icp ? "✅" : "❌"}`);
    if (icp && (icp.persona || icp.personaName)) {
      console.log(`    Persona: ${icp.persona || icp.personaName}`);
    }
  }
  
  await mongoose.disconnect();
  console.log("\n✅ Готово!");
}

copyLeanCanvasAndICP();





