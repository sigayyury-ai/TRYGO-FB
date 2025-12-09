#!/usr/bin/env tsx

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectIds = [
  "693837ae163ed59ff5b45345", // Comoon
  "686774b6773b5947fed60a78"  // AI marketing copilot
];

async function checkProjects() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  for (const projectId of projectIds) {
    try {
      // Пробуем как ObjectId
      let project = await db.collection("projects").findOne({ 
        _id: new mongoose.Types.ObjectId(projectId) 
      });
      
      // Если не найдено, пробуем как строку
      if (!project) {
        project = await db.collection("projects").findOne({ 
          _id: projectId 
        });
      }
      
      // Если не найдено, пробуем поиск по projectId как строке в поле _id
      if (!project) {
        project = await db.collection("projects").findOne({ 
          $or: [
            { _id: projectId },
            { _id: new mongoose.Types.ObjectId(projectId) }
          ]
        });
      }
      
      if (project) {
        console.log(`\n✅ Проект найден: ${project.title || "Без названия"}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${project.userId}`);
        console.log(`   userId тип: ${typeof project.userId}`);
        
        // Ищем гипотезы - пробуем разные варианты projectId
        let hypotheses = await db.collection("hypotheses").find({ 
          projectId: projectId 
        }).toArray();
        
        if (hypotheses.length === 0) {
          hypotheses = await db.collection("hypotheses").find({ 
            projectId: project._id.toString() 
          }).toArray();
        }
        
        console.log(`   Гипотезы (${hypotheses.length}):`);
        hypotheses.forEach(h => {
          console.log(`     - ${h._id}: ${h.title || "Без названия"}`);
        });
      } else {
        console.log(`\n❌ Проект ${projectId} не найден (пробовали как ObjectId и строку)`);
        
        // Показываем все проекты для отладки
        const allProjects = await db.collection("projects").find({}).limit(5).toArray();
        console.log(`   Примеры проектов в базе:`);
        allProjects.forEach(p => {
          console.log(`     - ${p._id} (${typeof p._id}): ${p.title || "Без названия"}`);
        });
      }
    } catch (error: any) {
      console.log(`\n❌ Ошибка при проверке ${projectId}: ${error.message}`);
    }
  }
  
  await mongoose.disconnect();
}

checkProjects();

