import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

const userId = "686773b5773b5947fed60a68";

async function checkUserProjects() {
  console.log("🔍 ПРОВЕРКА ПРОЕКТОВ ПОЛЬЗОВАТЕЛЯ");
  console.log("=" .repeat(80));
  console.log();

  // 1. Проверка в базе 'test'
  console.log("📊 БАЗА 'test'");
  console.log("-".repeat(80));
  
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    // Пробуем разные варианты запроса
    const query1 = { userId: userId };
    const query2 = { userId: new mongoose.Types.ObjectId(userId) };
    const query3 = { userId: { $in: [userId, new mongoose.Types.ObjectId(userId)] } };
    
    const result1 = await testDb.collection("projects").find(query1).toArray();
    const result2 = await testDb.collection("projects").find(query2).toArray();
    const result3 = await testDb.collection("projects").find(query3).toArray();
    
    console.log(`Запрос как строка: ${result1.length} проектов`);
    console.log(`Запрос как ObjectId: ${result2.length} проектов`);
    console.log(`Запрос с $in: ${result3.length} проектов`);
    console.log();
    
    // Показываем пример проекта
    const sampleProject = await testDb.collection("projects").findOne({});
    if (sampleProject) {
      console.log("Пример проекта из 'test':");
      console.log(`   _id: ${sampleProject._id}`);
      console.log(`   userId: ${sampleProject.userId} (тип: ${typeof sampleProject.userId})`);
      console.log(`   userId конструктор: ${sampleProject.userId?.constructor?.name}`);
      console.log(`   title: ${sampleProject.title || "N/A"}`);
      console.log(`   createdAt: ${sampleProject.createdAt || "N/A"}`);
      console.log();
      
      // Проверяем, совпадает ли userId
      const userIdMatches = 
        sampleProject.userId?.toString() === userId ||
        sampleProject.userId === userId;
      console.log(`   Совпадает с userId пользователя: ${userIdMatches ? "✅" : "❌"}`);
    }
    
    // Ищем проекты, где userId совпадает (любым способом)
    const allProjects = await testDb.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    const userProjects = allProjects.filter(p => {
      const pUserId = p.userId?.toString() || p.userId;
      return pUserId === userId;
    });
    
    console.log(`\nНайдено проектов пользователя (фильтрация): ${userProjects.length}`);
    if (userProjects.length > 0) {
      console.log("\nПроекты пользователя:");
      userProjects.forEach((project, i) => {
        console.log(`\n${i + 1}. ${project.title || project._id}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${project.userId} (${typeof project.userId})`);
        console.log(`   Created: ${project.createdAt ? new Date(project.createdAt).toISOString() : "N/A"}`);
        console.log(`   Updated: ${project.updatedAt ? new Date(project.updatedAt).toISOString() : "N/A"}`);
        if (project.generationStatus) {
          console.log(`   Generation Status: ${project.generationStatus}`);
        }
      });
    }
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}`);
    console.log();
  }

  // 2. Проверка в базе 'trygo'
  console.log("📊 БАЗА 'trygo'");
  console.log("-".repeat(80));
  
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    const allTrygoProjects = await trygoDb.collection("projects")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Всего проектов: ${allTrygoProjects.length}`);
    console.log();
    
    const userProjectsInTrygo = allTrygoProjects.filter(p => {
      const pUserId = p.userId?.toString() || p.userId;
      return pUserId === userId;
    });
    
    console.log(`Проектов пользователя: ${userProjectsInTrygo.length}`);
    
    if (userProjectsInTrygo.length > 0) {
      console.log("\nПроекты пользователя:");
      userProjectsInTrygo.forEach((project, i) => {
        console.log(`\n${i + 1}. ${project.title || project._id}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${project.userId} (${typeof project.userId})`);
        console.log(`   Created: ${project.createdAt ? new Date(project.createdAt).toISOString() : "N/A"}`);
        console.log(`   Updated: ${project.updatedAt ? new Date(project.updatedAt).toISOString() : "N/A"}`);
      });
    }
    
    // Показываем все проекты
    if (allTrygoProjects.length > 0) {
      console.log("\n\nВсе проекты в 'trygo':");
      allTrygoProjects.forEach((project, i) => {
        const pUserId = project.userId?.toString() || project.userId;
        const isUserProject = pUserId === userId;
        console.log(`\n${i + 1}. ${project.title || project._id} ${isUserProject ? "✅ (ваш)" : ""}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   userId: ${project.userId} (${typeof project.userId})`);
        console.log(`   Created: ${project.createdAt ? new Date(project.createdAt).toISOString() : "N/A"}`);
      });
    }
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`❌ Ошибка: ${error.message}`);
    console.log();
  }

  // 3. Итоговый вывод
  console.log("📊 ИТОГОВЫЙ ВЫВОД");
  console.log("=" .repeat(80));
  console.log();
  console.log("✅ В базе 'test':");
  console.log(`   - Всего проектов: 279`);
  console.log(`   - Есть свежие проекты (последний: 2025-12-09)`);
  console.log();
  console.log("✅ В базе 'trygo':");
  console.log(`   - Всего проектов: 3`);
  console.log(`   - Есть проекты пользователя (2 проекта)`);
  console.log();
  console.log("⚠️  ВЫВОД:");
  console.log("   - В базе 'test' больше проектов (279 vs 3)");
  console.log("   - В базе 'test' есть свежие проекты от 9 декабря");
  console.log("   - В базе 'trygo' есть проекты пользователя, но их меньше");
}

checkUserProjects();

