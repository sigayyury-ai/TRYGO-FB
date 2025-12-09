#!/usr/bin/env tsx

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = process.argv[2] || "686774b6773b5947fed60a78";

async function checkProject() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  const projects = await db.collection("projects").find({ _id: new mongoose.Types.ObjectId(projectId) }).toArray();
  
  if (projects.length === 0) {
    console.log(`❌ Проект ${projectId} не найден`);
    
    // Показываем все проекты
    const allProjects = await db.collection("projects").find({}).limit(10).toArray();
    console.log("\nДоступные проекты:");
    allProjects.forEach(p => {
      console.log(`  - ${p._id}: ${p.title || "Без названия"}`);
    });
  } else {
    console.log(`✅ Проект найден: ${projects[0].title || "Без названия"}`);
    console.log(`   ID: ${projects[0]._id}`);
  }
  
  await mongoose.disconnect();
}

checkProject();

