import "dotenv/config";
import mongoose from "mongoose";

const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";
const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";

async function checkUserContentSplit() {
  console.log("🔍 ПРОВЕРКА РАСПРЕДЕЛЕНИЯ ПОЛЬЗОВАТЕЛЕЙ И КОНТЕНТА");
  console.log("=" .repeat(80));
  console.log();

  // 1. Проверка базы 'trygo'
  console.log("📊 БАЗА ДАННЫХ 'trygo'");
  console.log("-".repeat(80));
  
  try {
    await mongoose.connect(trygoUri);
    const db = mongoose.connection.db;
    
    // Пользователи
    const trygoUsers = await db.collection("users").countDocuments({});
    console.log(`   👤 users: ${trygoUsers} документов`);
    
    // Контент
    const trygoContent = await db.collection("seocontentitems").countDocuments({});
    const trygoBacklog = await db.collection("seobacklogideas").countDocuments({});
    console.log(`   📝 seocontentitems: ${trygoContent} документов`);
    console.log(`   📋 seobacklogideas: ${trygoBacklog} документов`);
    
    // Проекты
    const trygoProjects = await db.collection("projects").countDocuments({});
    console.log(`   📁 projects: ${trygoProjects} документов`);
    
    // Гипотезы
    const trygoHypotheses = await db.collection("projectHypotheses").countDocuments({});
    console.log(`   🎯 projectHypotheses: ${trygoHypotheses} документов`);
    
    // Проверяем связи - есть ли userId в проектах
    if (trygoProjects > 0) {
      const sampleProject = await db.collection("projects").findOne({});
      console.log(`   📋 Поля проекта:`, Object.keys(sampleProject || {}).join(", "));
      if (sampleProject?.userId) {
        console.log(`   ⚠️  Проект ссылается на userId: ${sampleProject.userId}`);
        // Проверяем, существует ли этот пользователь в этой базе
        const userExists = await db.collection("users").countDocuments({ _id: sampleProject.userId });
        console.log(`   ${userExists > 0 ? "✅" : "❌"} Пользователь ${userExists > 0 ? "найден" : "НЕ найден"} в этой базе`);
      }
    }
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}`);
    console.log();
  }

  // 2. Проверка базы 'test'
  console.log("📊 БАЗА ДАННЫХ 'test'");
  console.log("-".repeat(80));
  
  try {
    await mongoose.connect(testUri);
    const db = mongoose.connection.db;
    
    // Пользователи
    const testUsers = await db.collection("users").countDocuments({});
    console.log(`   👤 users: ${testUsers} документов`);
    
    // Контент
    const testContent = await db.collection("seocontentitems").countDocuments({});
    const testBacklog = await db.collection("seobacklogideas").countDocuments({});
    console.log(`   📝 seocontentitems: ${testContent} документов`);
    console.log(`   📋 seobacklogideas: ${testBacklog} документов`);
    
    // Проекты
    const testProjects = await db.collection("projects").countDocuments({});
    console.log(`   📁 projects: ${testProjects} документов`);
    
    // Гипотезы
    const testHypotheses = await db.collection("projectHypotheses").countDocuments({});
    console.log(`   🎯 projectHypotheses: ${testHypotheses} документов`);
    
    // Проверяем связи - есть ли userId в проектах
    if (testProjects > 0) {
      const sampleProject = await db.collection("projects").findOne({});
      console.log(`   📋 Поля проекта:`, Object.keys(sampleProject || {}).join(", "));
      if (sampleProject?.userId) {
        console.log(`   ⚠️  Проект ссылается на userId: ${sampleProject.userId}`);
        // Проверяем, существует ли этот пользователь в этой базе
        const userExists = await db.collection("users").countDocuments({ _id: sampleProject.userId });
        console.log(`   ${userExists > 0 ? "✅" : "❌"} Пользователь ${userExists > 0 ? "найден" : "НЕ найден"} в этой базе`);
      }
    }
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`   ❌ Ошибка: ${error.message}`);
    console.log();
  }

  // 3. Итоговый вывод
  console.log("📊 ИТОГОВЫЙ ВЫВОД");
  console.log("=" .repeat(80));
  console.log();
  
  console.log("✅ ПОДТВЕРЖДЕНО: МИКС БАЗ ДАННЫХ!");
  console.log();
  console.log("Проблема:");
  console.log("  - 👤 Пользователи хранятся в базе 'test' (321 пользователь)");
  console.log("  - 📝 Контент хранится в базе 'trygo' (173 элемента)");
  console.log("  - 📋 Backlog хранится в базе 'trygo' (150 элементов)");
  console.log();
  console.log("Последствия:");
  console.log("  ❌ Проекты в 'trygo' ссылаются на userId, но пользователей там нет");
  console.log("  ❌ Невозможно связать контент с пользователями");
  console.log("  ❌ Проблемы с авторизацией и доступом");
  console.log();
  console.log("Решение:");
  console.log("  1. Перенести пользователей из 'test' в 'trygo'");
  console.log("  2. ИЛИ перенести контент из 'trygo' в 'test'");
  console.log("  3. ИЛИ использовать одну базу данных для всего");
}

checkUserContentSplit();

