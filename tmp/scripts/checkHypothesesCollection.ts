import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

async function checkHypothesesCollection() {
  console.log("🔍 ПРОВЕРКА КОЛЛЕКЦИЙ ГИПОТЕЗ");
  console.log("=" .repeat(80));
  console.log();

  // Проверяем базу 'test'
  console.log("📊 БАЗА 'test':");
  console.log("-".repeat(80));
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    // Получаем все коллекции
    const collections = await testDb.listCollections().toArray();
    const hypothesisCollections = collections.filter(c => 
      c.name.toLowerCase().includes('hypothesis') || 
      c.name.toLowerCase().includes('hypotheses')
    );
    
    console.log("Коллекции, связанные с гипотезами:");
    hypothesisCollections.forEach(c => {
      console.log(`   - ${c.name}`);
    });
    
    // Пробуем разные варианты названий
    const possibleNames = [
      "projecthypotheses",
      "projectHypotheses",
      "ProjectHypotheses",
      "hypotheses",
      "Hypotheses"
    ];
    
    for (const name of possibleNames) {
      try {
        const count = await testDb.collection(name).countDocuments({});
        if (count > 0) {
          console.log(`\n✅ Найдена коллекция '${name}' с ${count} документами`);
          const sample = await testDb.collection(name).findOne({});
          console.log(`   Пример документа:`, JSON.stringify(sample, null, 2).substring(0, 200));
        }
      } catch (e) {
        // Коллекция не существует
      }
    }
    
    await mongoose.disconnect();
  } catch (error: any) {
    console.error(`❌ Ошибка: ${error.message}`);
  }

  console.log("\n");

  // Проверяем базу 'trygo'
  console.log("📊 БАЗА 'trygo':");
  console.log("-".repeat(80));
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    // Получаем все коллекции
    const collections = await trygoDb.listCollections().toArray();
    const hypothesisCollections = collections.filter(c => 
      c.name.toLowerCase().includes('hypothesis') || 
      c.name.toLowerCase().includes('hypotheses')
    );
    
    console.log("Коллекции, связанные с гипотезами:");
    hypothesisCollections.forEach(c => {
      console.log(`   - ${c.name}`);
    });
    
    // Пробуем разные варианты названий
    const possibleNames = [
      "projecthypotheses",
      "projectHypotheses",
      "ProjectHypotheses",
      "hypotheses",
      "Hypotheses"
    ];
    
    for (const name of possibleNames) {
      try {
        const count = await trygoDb.collection(name).countDocuments({});
        if (count > 0) {
          console.log(`\n✅ Найдена коллекция '${name}' с ${count} документами`);
          const sample = await trygoDb.collection(name).findOne({});
          console.log(`   Пример документа:`, JSON.stringify(sample, null, 2).substring(0, 200));
        }
      } catch (e) {
        // Коллекция не существует
      }
    }
    
    await mongoose.disconnect();
  } catch (error: any) {
    console.error(`❌ Ошибка: ${error.message}`);
  }
}

checkHypothesesCollection();

