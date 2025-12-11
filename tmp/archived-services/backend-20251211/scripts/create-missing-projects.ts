#!/usr/bin/env tsx

/**
 * Скрипт для создания недостающих проектов для пользователя sigayyury5@gmail.com
 * Использует правильную структуру из ProjectModel
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const userId = "686773b5773b5947fed60a68"; // sigayyury5@gmail.com

// Структура проекта согласно ProjectModel:
// - userId: ObjectId (required)
// - title: String (required)
// - generationStatus: String (default: InProgress)
// - startType: String (required, enum)
// - info: String (required)
// - url: String (optional)
// - assistantId: String (required)
// - timestamps: автоматически

const projectsToCreate = [
  {
    _id: new mongoose.Types.ObjectId("686774b6773b5947fed60a78"),
    userId: new mongoose.Types.ObjectId(userId),
    title: "AI marketing copilot",
    generationStatus: "GENERATED", // ProjectGenerationStatus.Generated
    startType: "FROM_SCRATCH", // ProjectStartType.FromScratch
    info: "AI marketing copilot project for solo founders",
    assistantId: `assistant_${Date.now()}_1`, // Временный ID, можно заменить на реальный
  },
  {
    _id: new mongoose.Types.ObjectId("693837ae163ed59ff5b45345"),
    userId: new mongoose.Types.ObjectId(userId),
    title: "Comoon",
    generationStatus: "GENERATED",
    startType: "FROM_SCRATCH",
    info: "Comoon project",
    assistantId: `assistant_${Date.now()}_2`,
  }
];

async function createProjects() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  console.log("=== СОЗДАНИЕ ПРОЕКТОВ ===");
  console.log(`База данных: ${mongoose.connection.name}`);
  console.log(`Коллекция: projects`);
  console.log(`Пользователь: sigayyury5@gmail.com (${userId})\n`);
  
  for (const projectData of projectsToCreate) {
    try {
      // Проверяем, существует ли уже
      const existing = await db.collection("projects").findOne({ 
        _id: projectData._id 
      });
      
      if (existing) {
        console.log(`⚠️  Проект ${projectData._id} уже существует:`);
        console.log(`   Название: ${existing.title}`);
        console.log(`   userId: ${existing.userId}`);
        console.log(`   Коллекция: projects ✅\n`);
        continue;
      }
      
      // Создаем проект в коллекции 'projects'
      const result = await db.collection("projects").insertOne(projectData);
      console.log(`✅ Создан проект:`);
      console.log(`   ID: ${projectData._id}`);
      console.log(`   Название: ${projectData.title}`);
      console.log(`   userId: ${projectData.userId}`);
      console.log(`   Коллекция: projects`);
      console.log(`   generationStatus: ${projectData.generationStatus}`);
      console.log(`   startType: ${projectData.startType}\n`);
      
      // Создаем гипотезу "Solo founders" для AI marketing copilot
      if (projectData._id.toString() === "686774b6773b5947fed60a78") {
        const hypothesisId = new mongoose.Types.ObjectId("687fe5363c4cca83a3cc578d");
        
        // Проверяем коллекции для гипотез
        const collections = await db.listCollections().toArray();
        const hypothesisCollections = collections.filter(c => 
          c.name.toLowerCase().includes('hypothesis') || 
          c.name.toLowerCase().includes('projecthypothesis')
        );
        console.log(`Найденные коллекции для гипотез: ${hypothesisCollections.map(c => c.name).join(', ') || 'не найдено'}`);
        
        // Пробуем найти в разных коллекциях
        let existingHyp = null;
        for (const collName of ['hypotheses', 'projecthypotheses', 'projectHypotheses']) {
          try {
            existingHyp = await db.collection(collName).findOne({ _id: hypothesisId });
            if (existingHyp) {
              console.log(`   ⚠️  Гипотеза ${hypothesisId} уже существует в коллекции ${collName}`);
              break;
            }
          } catch (e) {
            // Коллекция не существует
          }
        }
        
        if (!existingHyp) {
          // Создаем в коллекции projecthypotheses (судя по моделям)
          const hypData = {
            _id: hypothesisId,
            projectId: projectData._id.toString(),
            title: "Solo founders",
            description: "Hypothesis for solo founders",
            userId: new mongoose.Types.ObjectId(userId),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          // Пробуем создать в projecthypotheses
          try {
            await db.collection("projecthypotheses").insertOne(hypData);
            console.log(`   ✅ Создана гипотеза: Solo founders (${hypothesisId}) в коллекции projecthypotheses`);
          } catch (e: any) {
            // Если не получилось, пробуем hypotheses
            try {
              await db.collection("hypotheses").insertOne(hypData);
              console.log(`   ✅ Создана гипотеза: Solo founders (${hypothesisId}) в коллекции hypotheses`);
            } catch (e2: any) {
              console.log(`   ⚠️  Не удалось создать гипотезу: ${e2.message}`);
            }
          }
        }
        console.log("");
      }
      
    } catch (error: any) {
      console.error(`❌ Ошибка при создании проекта ${projectData._id}: ${error.message}`);
      console.error(`   Детали:`, error);
      console.log("");
    }
  }
  
  // Проверяем результат
  console.log("\n=== ПРОВЕРКА РЕЗУЛЬТАТА ===");
  const userProjects = await db.collection("projects").find({ 
    userId: new mongoose.Types.ObjectId(userId) 
  }).toArray();
  
  console.log(`Найдено проектов пользователя: ${userProjects.length}`);
  userProjects.forEach(p => {
    console.log(`  - ${p._id}: ${p.title}`);
  });
  
  await mongoose.disconnect();
  console.log("\n✅ Готово!");
}

createProjects();

