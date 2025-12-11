import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

async function checkFrontendData() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    
    // Находим проект и гипотезу
    const project = await db.collection("projects").findOne({ title: "AI marketing copilot" });
    if (!project) {
      console.error("❌ Проект не найден");
      process.exit(1);
    }
    
    const hypothesis = await db.collection("projectHypotheses").findOne({ 
      projectId: project._id,
      title: "Solo founders"
    });
    
    if (!hypothesis) {
      console.error("❌ Гипотеза не найдена");
      process.exit(1);
    }
    
    const projectId = project._id.toString();
    const hypothesisId = hypothesis._id.toString();
    const userId = typeof project.userId === 'object' ? project.userId.toString() : project.userId;
    
    // Проверяем данные в БД
    const ideas = await db.collection("seocontentitems").find({
      projectId: projectId,
      hypothesisId: hypothesisId,
      category: "pain",
      status: { $ne: "archived" }
    }).sort({ createdAt: -1 }).toArray();
    
    console.log("\n=== ДАННЫЕ В БД ===");
    console.log(`Всего идей PAINS: ${ideas.length}`);
    if (ideas.length > 0) {
      console.log("\nПоследние 5 идей:");
      ideas.slice(0, 5).forEach((idea, i) => {
        console.log(`${i + 1}. ${idea.title}`);
        console.log(`   ID: ${idea._id.toString()}`);
        console.log(`   Создано: ${new Date(idea.createdAt).toLocaleString()}`);
      });
    }
    
    // Проверяем через GraphQL query (как фронтенд)
    const { resolvers } = await import("../src/schema/resolvers.js");
    const mockContext = {
      userId: userId
    };
    
    console.log("\n=== ТЕСТИРОВАНИЕ GRAPHQL QUERY (как фронтенд) ===");
    const queryResult = await resolvers.Query.seoAgentContentIdeas(
      null,
      { projectId, hypothesisId },
      mockContext
    );
    
    const painsIdeas = queryResult.filter((idea: any) => idea.category === "PAINS");
    
    console.log(`Всего идей через query: ${queryResult.length}`);
    console.log(`Идей PAINS: ${painsIdeas.length}`);
    
    if (painsIdeas.length > 0) {
      console.log("\nПервые 5 идей PAINS (как видит фронтенд):");
      painsIdeas.slice(0, 5).forEach((idea: any, i: number) => {
        console.log(`${i + 1}. ${idea.title}`);
        console.log(`   ID: ${idea.id}`);
        console.log(`   Категория: ${idea.category}`);
        console.log(`   Dismissed: ${idea.dismissed || false}`);
      });
    }
    
    console.log("\n=== ✅ ПРОВЕРКА ЗАВЕРШЕНА ===");
    console.log(`📊 Статус:`);
    console.log(`   ✅ В БД: ${ideas.length} идей`);
    console.log(`   ✅ Через query: ${painsIdeas.length} идей PAINS`);
    console.log(`   ✅ Project ID: ${projectId}`);
    console.log(`   ✅ Hypothesis ID: ${hypothesisId}`);
    
    if (painsIdeas.length > 0) {
      console.log(`\n✅ Идеи доступны для фронтенда!`);
      console.log(`\n💡 Инструкция:`);
      console.log(`   1. Откройте http://localhost:8080/seo-agent#content`);
      console.log(`   2. Убедитесь, что выбран проект: "${project.title}"`);
      console.log(`   3. Убедитесь, что выбрана гипотеза: "${hypothesis.title}"`);
      console.log(`   4. Идеи должны отобразиться автоматически (${painsIdeas.length} идей)`);
      console.log(`\n🔍 Если идеи не видны:`);
      console.log(`   - Откройте консоль браузера (F12)`);
      console.log(`   - Проверьте логи [SeoContentPanel]`);
      console.log(`   - Проверьте, что projectId и hypothesisId совпадают`);
    } else {
      console.log(`\n❌ Идеи не найдены через query`);
      console.log(`   Проверьте, что данные сохранены в БД`);
    }
    
    await mongoose.connection.close();
  } catch (error: any) {
    console.error("❌ Ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

checkFrontendData();



