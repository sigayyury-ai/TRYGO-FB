#!/usr/bin/env tsx

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

async function findProject() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  // Ищем проект "AI marketing copilot"
  const projects = await db.collection("projects").find({ 
    title: { $regex: /AI.*marketing.*copilot|marketing.*copilot/i } 
  }).toArray();
  
  console.log("Найденные проекты:");
  projects.forEach(p => {
    console.log(`\nПроект: ${p.title}`);
    console.log(`  ID: ${p._id}`);
  });
  
  if (projects.length > 0) {
    const projectId = projects[0]._id.toString();
    
    // Ищем гипотезы для этого проекта
    const hypotheses = await db.collection("hypotheses").find({ 
      projectId: projectId,
      title: { $regex: /solo.*founder/i }
    }).toArray();
    
    console.log(`\n\nНайденные гипотезы для проекта ${projectId}:`);
    hypotheses.forEach(h => {
      console.log(`\nГипотеза: ${h.title}`);
      console.log(`  ID: ${h._id}`);
    });
    
    if (hypotheses.length === 0) {
      // Показываем все гипотезы проекта
      const allHypotheses = await db.collection("hypotheses").find({ 
        projectId: projectId
      }).toArray();
      
      console.log(`\n\nВсе гипотезы проекта:`);
      allHypotheses.forEach(h => {
        console.log(`  - ${h._id}: ${h.title || "Без названия"}`);
      });
    }
  }
  
  await mongoose.disconnect();
}

findProject();


