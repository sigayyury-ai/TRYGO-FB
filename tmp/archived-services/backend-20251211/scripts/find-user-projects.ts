#!/usr/bin/env tsx

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const userId = process.argv[2] || "686773b5773b5947fed60a68"; // sigayyury5@gmail.com

async function findProjects() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  // Ищем проекты пользователя
  const projects = await db.collection("projects").find({ 
    userId: new mongoose.Types.ObjectId(userId)
  }).toArray();
  
  console.log(`Найдено проектов для пользователя ${userId}: ${projects.length}\n`);
  
  projects.forEach(p => {
    console.log(`Проект: ${p.title || "Без названия"}`);
    console.log(`  ID: ${p._id}`);
    
    // Ищем гипотезы
    db.collection("hypotheses").find({ projectId: p._id.toString() }).toArray().then(hypotheses => {
      console.log(`  Гипотезы: ${hypotheses.length}`);
      hypotheses.forEach(h => {
        console.log(`    - ${h._id}: ${h.title || "Без названия"}`);
      });
      console.log("");
    });
  });
  
  await mongoose.disconnect();
}

findProjects();

