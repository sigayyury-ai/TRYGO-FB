#!/usr/bin/env tsx

/**
 * Скрипт для привязки гипотез к проекту AI marketing copilot
 */

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78"; // AI marketing copilot
const userId = "686773b5773b5947fed60a68"; // sigayyury5@gmail.com

const hypothesesToLink = [
  { id: "686774c1773b5947fed60a7a", title: "Marketing Managers" },
  { id: "687b474d3c4cca83a3cc428e", title: "indi developers" },
  { id: "687fe5363c4cca83a3cc578d", title: "Solo founders" },
  { id: "68ac39d555525306f9486057", title: "Product owners" },
  { id: "68ac3abe55525306f9486097", title: "Product managers" },
  { id: "68ac5ae755525306f948612b", title: "BDM" }
];

async function linkHypotheses() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  console.log("=== ПРИВЯЗКА ГИПОТЕЗ К ПРОЕКТУ ===\n");
  console.log(`Проект: AI marketing copilot (${projectId})`);
  console.log(`Пользователь: sigayyury5@gmail.com (${userId})\n`);
  
  // Проверяем, что проект существует
  const project = await db.collection("projects").findOne({ _id: projectObjectId });
  if (!project) {
    console.error(`❌ Проект ${projectId} не найден!`);
    await mongoose.disconnect();
    return;
  }
  console.log(`✅ Проект найден: ${project.title}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const hyp of hypothesesToLink) {
    try {
      const hypothesisId = new mongoose.Types.ObjectId(hyp.id);
      
      console.log(`Обработка: ${hyp.title} (${hyp.id})`);
      
      // Ищем гипотезу в разных коллекциях
      let foundHyp = null;
      let foundCollection = null;
      
      for (const collName of ['projectHypotheses', 'projecthypotheses', 'hypotheses']) {
        try {
          const hypDoc = await db.collection(collName).findOne({ _id: hypothesisId });
          if (hypDoc) {
            foundHyp = hypDoc;
            foundCollection = collName;
            break;
          }
        } catch (e) {
          // Коллекция не существует
        }
      }
      
      if (!foundHyp) {
        // Гипотеза не найдена - создаем новую
        console.log(`  ⚠️  Гипотеза не найдена, создаем новую...`);
        
        const newHyp = {
          _id: hypothesisId,
          userId: userObjectId,
          projectId: projectObjectId,
          title: hyp.title,
          description: `Hypothesis: ${hyp.title}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.collection("projectHypotheses").insertOne(newHyp);
        console.log(`  ✅ Создана новая гипотеза в projectHypotheses`);
        successCount++;
        continue;
      }
      
      // Гипотеза найдена - проверяем и обновляем
      console.log(`  ✅ Найдена в коллекции: ${foundCollection}`);
      
      const currentProjectId = typeof foundHyp.projectId === 'object' 
        ? foundHyp.projectId.toString() 
        : foundHyp.projectId;
      
      if (currentProjectId === projectId) {
        console.log(`  ✅ Уже привязана к правильному проекту`);
        
        // Проверяем, что она в правильной коллекции
        if (foundCollection !== "projectHypotheses") {
          // Перемещаем в правильную коллекцию
          const correctHyp = {
            _id: hypothesisId,
            userId: typeof foundHyp.userId === 'object' ? foundHyp.userId : new mongoose.Types.ObjectId(foundHyp.userId),
            projectId: projectObjectId,
            title: foundHyp.title || hyp.title,
            description: foundHyp.description || `Hypothesis: ${hyp.title}`,
            createdAt: foundHyp.createdAt || new Date(),
            updatedAt: new Date()
          };
          
          await db.collection("projectHypotheses").insertOne(correctHyp);
          await db.collection(foundCollection).deleteOne({ _id: hypothesisId });
          console.log(`  ✅ Перемещена в правильную коллекцию projectHypotheses`);
        }
        successCount++;
      } else {
        // Обновляем projectId
        console.log(`  ⚠️  Привязана к другому проекту: ${currentProjectId}`);
        console.log(`  🔄 Обновляем projectId...`);
        
        const updateData: any = {
          projectId: projectObjectId,
          updatedAt: new Date()
        };
        
        // Если в неправильной коллекции, перемещаем
        if (foundCollection !== "projectHypotheses") {
          const correctHyp = {
            _id: hypothesisId,
            userId: typeof foundHyp.userId === 'object' ? foundHyp.userId : new mongoose.Types.ObjectId(foundHyp.userId),
            projectId: projectObjectId,
            title: foundHyp.title || hyp.title,
            description: foundHyp.description || `Hypothesis: ${hyp.title}`,
            createdAt: foundHyp.createdAt || new Date(),
            updatedAt: new Date()
          };
          
          await db.collection("projectHypotheses").insertOne(correctHyp);
          await db.collection(foundCollection).deleteOne({ _id: hypothesisId });
          console.log(`  ✅ Перемещена в projectHypotheses и обновлена`);
        } else {
          await db.collection("projectHypotheses").updateOne(
            { _id: hypothesisId },
            { $set: updateData }
          );
          console.log(`  ✅ projectId обновлен`);
        }
        successCount++;
      }
      
    } catch (error: any) {
      console.error(`  ❌ Ошибка: ${error.message}`);
      errorCount++;
    }
    
    console.log("");
  }
  
  // Проверяем результат
  console.log("\n=== ПРОВЕРКА РЕЗУЛЬТАТА ===");
  const allHypotheses = await db.collection("projectHypotheses").find({ 
    projectId: projectObjectId 
  }).toArray();
  
  console.log(`Всего гипотез у проекта: ${allHypotheses.length}`);
  allHypotheses.forEach((h, i) => {
    const hypProjectId = typeof h.projectId === 'object' ? h.projectId.toString() : h.projectId;
    const status = hypProjectId === projectId ? "✅" : "❌";
    console.log(`  ${i + 1}. ${status} ${h.title} (${h._id})`);
  });
  
  console.log(`\n✅ Успешно обработано: ${successCount}`);
  if (errorCount > 0) {
    console.log(`❌ Ошибок: ${errorCount}`);
  }
  
  await mongoose.disconnect();
  console.log("\n✅ Готово!");
}

linkHypotheses();

