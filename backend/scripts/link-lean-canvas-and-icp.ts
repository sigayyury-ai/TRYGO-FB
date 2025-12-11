#!/usr/bin/env tsx

/**
 * Скрипт для перелинковки существующих Lean Canvas и ICP к правильным гипотезам
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78"; // AI marketing copilot

const hypotheses = [
  { id: "686774c1773b5947fed60a7a", title: "Marketing Managers" },
  { id: "687b474d3c4cca83a3cc428e", title: "indi developers" },
  { id: "687fe5363c4cca83a3cc578d", title: "Solo founders" },
  { id: "68ac39d555525306f9486057", title: "Product owners" },
  { id: "68ac3abe55525306f9486097", title: "Product managers" },
  { id: "68ac5ae755525306f948612b", title: "BDM" }
];

async function linkLeanCanvasAndICP() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  console.log("=== ПЕРЕЛИНКОВКА LEAN CANVAS И ICP ===\n");
  console.log(`Проект: AI marketing copilot (${projectId})\n`);
  
  for (const hyp of hypotheses) {
    try {
      const hypothesisId = new mongoose.Types.ObjectId(hyp.id);
      
      console.log(`Обработка гипотезы: ${hyp.title} (${hyp.id})`);
      
      // 1. Ищем Lean Canvas (hypothesesCores)
      const leanCanvas = await db.collection("hypothesesCores").findOne({
        projectHypothesisId: hypothesisId
      });
      
      if (leanCanvas) {
        console.log(`  ✅ Lean Canvas уже привязан`);
      } else {
        // Ищем Lean Canvas с другим projectHypothesisId, который можно перелинковать
        // Ищем по старому ID гипотезы или по projectId
        const projectObjectId = new mongoose.Types.ObjectId(projectId);
        
        // Пробуем найти Lean Canvas, который можно перелинковать
        const candidateLeanCanvas = await db.collection("hypothesesCores").findOne({
          $or: [
            { projectHypothesisId: { $exists: false } },
            { projectHypothesisId: null }
          ]
        });
        
        if (candidateLeanCanvas) {
          await db.collection("hypothesesCores").updateOne(
            { _id: candidateLeanCanvas._id },
            { $set: { projectHypothesisId: hypothesisId } }
          );
          console.log(`  ✅ Lean Canvas перелинкован (ID: ${candidateLeanCanvas._id})`);
        } else {
          // Ищем по projectId в других полях
          const leanCanvasByProject = await db.collection("hypothesesCores").findOne({
            projectId: projectObjectId
          });
          
          if (leanCanvasByProject) {
            await db.collection("hypothesesCores").updateOne(
              { _id: leanCanvasByProject._id },
              { $set: { projectHypothesisId: hypothesisId } }
            );
            console.log(`  ✅ Lean Canvas перелинкован по projectId (ID: ${leanCanvasByProject._id})`);
          } else {
            console.log(`  ⚠️  Lean Canvas не найден для перелинковки`);
          }
        }
      }
      
      // 2. Ищем ICP (hypothesesPersonProfiles)
      const icp = await db.collection("hypothesesPersonProfiles").findOne({
        projectHypothesisId: hypothesisId
      });
      
      if (icp) {
        console.log(`  ✅ ICP уже привязан`);
      } else {
        // Ищем ICP с другим projectHypothesisId, который можно перелинковать
        const candidateICP = await db.collection("hypothesesPersonProfiles").findOne({
          $or: [
            { projectHypothesisId: { $exists: false } },
            { projectHypothesisId: null }
          ]
        });
        
        if (candidateICP) {
          await db.collection("hypothesesPersonProfiles").updateOne(
            { _id: candidateICP._id },
            { $set: { projectHypothesisId: hypothesisId } }
          );
          console.log(`  ✅ ICP перелинкован (ID: ${candidateICP._id})`);
        } else {
          // Ищем по projectId
          const projectObjectId = new mongoose.Types.ObjectId(projectId);
          const icpByProject = await db.collection("hypothesesPersonProfiles").findOne({
            projectId: projectObjectId
          });
          
          if (icpByProject) {
            await db.collection("hypothesesPersonProfiles").updateOne(
              { _id: icpByProject._id },
              { $set: { projectHypothesisId: hypothesisId } }
            );
            console.log(`  ✅ ICP перелинкован по projectId (ID: ${icpByProject._id})`);
          } else {
            console.log(`  ⚠️  ICP не найден для перелинковки`);
          }
        }
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
  }
  
  await mongoose.disconnect();
  console.log("\n✅ Готово!");
}

linkLeanCanvasAndICP();





