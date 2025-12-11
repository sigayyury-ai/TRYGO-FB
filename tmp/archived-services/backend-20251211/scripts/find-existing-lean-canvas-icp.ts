#!/usr/bin/env tsx

/**
 * Поиск существующих Lean Canvas и ICP в базе
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";

async function findExisting() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  
  console.log("=== ПОИСК LEAN CANVAS И ICP ===\n");
  
  // 1. Все Lean Canvas
  console.log("1. LEAN CANVAS (hypothesesCores):");
  const allLeanCanvas = await db.collection("hypothesesCores").find({}).limit(20).toArray();
  console.log(`   Найдено всего: ${allLeanCanvas.length}`);
  
  allLeanCanvas.forEach((lc, i) => {
    console.log(`   ${i + 1}. ID: ${lc._id}`);
    console.log(`      projectHypothesisId: ${lc.projectHypothesisId || "не указан"}`);
    console.log(`      projectId: ${lc.projectId || "не указан"}`);
    if (lc.problems) console.log(`      problems: ${Array.isArray(lc.problems) ? lc.problems.length : "есть"}`);
    if (lc.solutions) console.log(`      solutions: ${Array.isArray(lc.solutions) ? lc.solutions.length : "есть"}`);
    console.log("");
  });
  
  // 2. Все ICP
  console.log("\n2. ICP (hypothesesPersonProfiles):");
  const allICP = await db.collection("hypothesesPersonProfiles").find({}).limit(20).toArray();
  console.log(`   Найдено всего: ${allICP.length}`);
  
  allICP.forEach((icp, i) => {
    console.log(`   ${i + 1}. ID: ${icp._id}`);
    console.log(`      projectHypothesisId: ${icp.projectHypothesisId || "не указан"}`);
    console.log(`      projectId: ${icp.projectId || "не указан"}`);
    if (icp.persona || icp.personaName) console.log(`      persona: ${icp.persona || icp.personaName}`);
    if (icp.pains || icp.userPains) console.log(`      pains: ${Array.isArray(icp.pains || icp.userPains) ? (icp.pains || icp.userPains).length : "есть"}`);
    if (icp.goals || icp.userGoals) console.log(`      goals: ${Array.isArray(icp.goals || icp.userGoals) ? (icp.goals || icp.userGoals).length : "есть"}`);
    console.log("");
  });
  
  // 3. Ищем по projectId
  console.log("\n3. ПОИСК ПО PROJECT ID:");
  const leanCanvasByProject = await db.collection("hypothesesCores").find({
    projectId: projectObjectId
  }).toArray();
  console.log(`   Lean Canvas для проекта: ${leanCanvasByProject.length}`);
  
  const icpByProject = await db.collection("hypothesesPersonProfiles").find({
    projectId: projectObjectId
  }).toArray();
  console.log(`   ICP для проекта: ${icpByProject.length}`);
  
  // 4. Проверяем гипотезы проекта
  console.log("\n4. ГИПОТЕЗЫ ПРОЕКТА:");
  const hypotheses = await db.collection("projectHypotheses").find({
    projectId: projectObjectId
  }).toArray();
  
  console.log(`   Найдено гипотез: ${hypotheses.length}`);
  hypotheses.forEach((h, i) => {
    console.log(`   ${i + 1}. ${h.title} (${h._id})`);
    
    const lc = allLeanCanvas.find(lc => 
      lc.projectHypothesisId && lc.projectHypothesisId.toString() === h._id.toString()
    );
    const icp = allICP.find(icp => 
      icp.projectHypothesisId && icp.projectHypothesisId.toString() === h._id.toString()
    );
    
    console.log(`      Lean Canvas: ${lc ? `✅ (${lc._id})` : "❌"}`);
    console.log(`      ICP: ${icp ? `✅ (${icp._id})` : "❌"}`);
  });
  
  await mongoose.disconnect();
}

findExisting();

