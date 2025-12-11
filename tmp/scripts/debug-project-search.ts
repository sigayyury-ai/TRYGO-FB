#!/usr/bin/env tsx

import mongoose from "mongoose";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectIds = [
  "693837ae163ed59ff5b45345", // Comoon
  "686774b6773b5947fed60a78", // AI marketing copilot
  "69387a92ef08390214f02418"  // Тот что нашли
];

async function debugSearch() {
  await mongoose.connect(MONGODB_URI!);
  
  const db = mongoose.connection.db;
  
  console.log("=== ДИАГНОСТИКА ПОИСКА ПРОЕКТОВ ===\n");
  
  // 1. Показываем ВСЕ проекты в базе
  console.log("1. ВСЕ ПРОЕКТЫ В БАЗЕ:");
  const allProjects = await db.collection("projects").find({}).limit(10).toArray();
  console.log(`   Найдено: ${allProjects.length}`);
  allProjects.forEach((p, i) => {
    console.log(`   ${i + 1}. ID: ${p._id} (тип: ${p._id.constructor.name})`);
    console.log(`      Название: ${p.title || "Без названия"}`);
    console.log(`      userId: ${p.userId} (тип: ${typeof p.userId})`);
    if (p.userId && typeof p.userId === 'object') {
      console.log(`      userId как строка: ${p.userId.toString()}`);
    }
    console.log("");
  });
  
  // 2. Пробуем найти каждый проект разными способами
  console.log("\n2. ПОПЫТКИ НАЙТИ ПРОЕКТЫ:\n");
  
  for (const projectIdStr of projectIds) {
    console.log(`--- Ищем проект: ${projectIdStr} ---`);
    
    // Способ 1: Как ObjectId
    try {
      const objId = new mongoose.Types.ObjectId(projectIdStr);
      const result1 = await db.collection("projects").findOne({ _id: objId });
      console.log(`   ✅ Способ 1 (ObjectId): ${result1 ? "НАЙДЕН" : "НЕ НАЙДЕН"}`);
      if (result1) {
        console.log(`      Название: ${result1.title}`);
      }
    } catch (e: any) {
      console.log(`   ❌ Способ 1 (ObjectId): ОШИБКА - ${e.message}`);
    }
    
    // Способ 2: Как строка
    try {
      const result2 = await db.collection("projects").findOne({ _id: projectIdStr });
      console.log(`   ✅ Способ 2 (строка): ${result2 ? "НАЙДЕН" : "НЕ НАЙДЕН"}`);
      if (result2) {
        console.log(`      Название: ${result2.title}`);
      }
    } catch (e: any) {
      console.log(`   ❌ Способ 2 (строка): ОШИБКА - ${e.message}`);
    }
    
    // Способ 3: Поиск по userId (если это userId)
    try {
      const result3 = await db.collection("projects").findOne({ 
        userId: new mongoose.Types.ObjectId(projectIdStr) 
      });
      console.log(`   ✅ Способ 3 (как userId ObjectId): ${result3 ? "НАЙДЕН" : "НЕ НАЙДЕН"}`);
      if (result3) {
        console.log(`      Название: ${result3.title}, ID: ${result3._id}`);
      }
    } catch (e: any) {
      console.log(`   ❌ Способ 3 (как userId ObjectId): ОШИБКА - ${e.message}`);
    }
    
    // Способ 4: Поиск по userId как строка
    try {
      const result4 = await db.collection("projects").findOne({ 
        userId: projectIdStr 
      });
      console.log(`   ✅ Способ 4 (как userId строка): ${result4 ? "НАЙДЕН" : "НЕ НАЙДЕН"}`);
      if (result4) {
        console.log(`      Название: ${result4.title}, ID: ${result4._id}`);
      }
    } catch (e: any) {
      console.log(`   ❌ Способ 4 (как userId строка): ОШИБКА - ${e.message}`);
    }
    
    console.log("");
  }
  
  // 3. Проверяем формат ID в базе
  console.log("\n3. АНАЛИЗ ФОРМАТА ID:");
  if (allProjects.length > 0) {
    const sample = allProjects[0];
    console.log(`   Пример ID из базы: ${sample._id}`);
    console.log(`   Тип: ${sample._id.constructor.name}`);
    console.log(`   Является ObjectId: ${sample._id instanceof mongoose.Types.ObjectId}`);
    console.log(`   toString(): ${sample._id.toString()}`);
    console.log(`   Длина строки: ${sample._id.toString().length}`);
  }
  
  // 4. Проверяем userId пользователя sigayyury5@gmail.com
  console.log("\n4. ПОИСК ПРОЕКТОВ ПОЛЬЗОВАТЕЛЯ sigayyury5@gmail.com:");
  const userId = "686773b5773b5947fed60a68";
  console.log(`   Ищем userId: ${userId}`);
  
  // Как ObjectId
  const userProjects1 = await db.collection("projects").find({ 
    userId: new mongoose.Types.ObjectId(userId) 
  }).toArray();
  console.log(`   Найдено (userId как ObjectId): ${userProjects1.length}`);
  userProjects1.forEach(p => {
    console.log(`     - ${p._id}: ${p.title}`);
  });
  
  // Как строка
  const userProjects2 = await db.collection("projects").find({ 
    userId: userId 
  }).toArray();
  console.log(`   Найдено (userId как строка): ${userProjects2.length}`);
  userProjects2.forEach(p => {
    console.log(`     - ${p._id}: ${p.title}`);
  });
  
  await mongoose.disconnect();
}

debugSearch();


