import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

const userEmail = "sigayyury5@gmail.com";
const userId = "686773b5773b5947fed60a68";

async function compareProjects() {
  console.log("🔍 СРАВНЕНИЕ ПРОЕКТОВ В БАЗАХ ДАННЫХ");
  console.log("=" .repeat(80));
  console.log();

  let userProjectsInTest: any[] = [];
  let userProjectsInTrygo: any[] = [];

  // 1. Проекты в базе 'test'
  console.log("📊 ПРОЕКТЫ В БАЗЕ 'test'");
  console.log("-".repeat(80));
  
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    const testProjects = await testDb.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    console.log(`Всего проектов: ${await testDb.collection("projects").countDocuments({})}`);
    console.log();

    // Проекты пользователя
    userProjectsInTest = await testDb.collection("projects")
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Проектов пользователя (${userEmail}): ${userProjectsInTest.length}`);
    
    if (userProjectsInTest.length > 0) {
      console.log("\nПроекты пользователя:");
      userProjectsInTest.forEach((project, i) => {
        console.log(`\n${i + 1}. ${project.title || project._id}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${project.userId}`);
        console.log(`   Created: ${project.createdAt ? new Date(project.createdAt).toISOString() : "N/A"}`);
        console.log(`   Updated: ${project.updatedAt ? new Date(project.updatedAt).toISOString() : "N/A"}`);
        if (project.generationStatus) {
          console.log(`   Generation Status: ${project.generationStatus}`);
        }
      });
    }
    
    // Самые свежие проекты (всех пользователей)
    console.log("\n\nСамые свежие проекты (всех пользователей, последние 5):");
    testProjects.slice(0, 5).forEach((project, i) => {
      console.log(`\n${i + 1}. ${project.title || project._id}`);
      console.log(`   ID: ${project._id}`);
      console.log(`   userId: ${project.userId}`);
      console.log(`   Created: ${project.createdAt ? new Date(project.createdAt).toISOString() : "N/A"}`);
    });
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}`);
    console.log();
  }

  // 2. Проекты в базе 'trygo'
  console.log("📊 ПРОЕКТЫ В БАЗЕ 'trygo'");
  console.log("-".repeat(80));
  
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    const trygoProjects = await trygoDb.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Всего проектов: ${trygoProjects.length}`);
    console.log();

    // Проекты пользователя
    userProjectsInTrygo = await trygoDb.collection("projects")
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Проектов пользователя (${userEmail}): ${userProjectsInTrygo.length}`);
    
    if (userProjectsInTrygo.length > 0) {
      console.log("\nПроекты пользователя:");
      userProjectsInTrygo.forEach((project, i) => {
        console.log(`\n${i + 1}. ${project.title || project._id}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${project.userId}`);
        console.log(`   Created: ${project.createdAt ? new Date(project.createdAt).toISOString() : "N/A"}`);
        console.log(`   Updated: ${project.updatedAt ? new Date(project.updatedAt).toISOString() : "N/A"}`);
      });
    } else {
      console.log("\n⚠️  У пользователя нет проектов в базе 'trygo'");
    }
    
    // Все проекты
    if (trygoProjects.length > 0) {
      console.log("\n\nВсе проекты в базе 'trygo':");
      trygoProjects.forEach((project, i) => {
        console.log(`\n${i + 1}. ${project.title || project._id}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${project.userId}`);
        console.log(`   Created: ${project.createdAt ? new Date(project.createdAt).toISOString() : "N/A"}`);
      });
    }
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}`);
    console.log();
  }

  // 3. Сравнение
  console.log("📊 ИТОГОВОЕ СРАВНЕНИЕ");
  console.log("=" .repeat(80));
  console.log();
  console.log("✅ В базе 'test':");
  console.log(`   - Всего проектов: 279`);
  console.log(`   - Проектов пользователя: ${userProjectsInTest.length}`);
  console.log();
  console.log("✅ В базе 'trygo':");
  console.log(`   - Всего проектов: 3`);
  console.log(`   - Проектов пользователя: ${userProjectsInTrygo.length}`);
  console.log();
  
  if (userProjectsInTest.length > 0 && userProjectsInTrygo.length === 0) {
    console.log("⚠️  ВЫВОД:");
    console.log("   - Свежие проекты пользователя находятся в базе 'test'");
    console.log("   - В базе 'trygo' проектов пользователя нет");
    console.log("   - Нужно перенести проекты из 'test' в 'trygo'");
  } else if (userProjectsInTest.length > userProjectsInTrygo.length) {
    console.log("⚠️  ВЫВОД:");
    console.log("   - В базе 'test' больше проектов пользователя");
    console.log("   - Некоторые проекты могут быть только в 'test'");
  }
}

compareProjects();

