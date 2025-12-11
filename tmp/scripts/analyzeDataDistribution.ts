import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

async function analyzeDataDistribution() {
  try {
    console.log("🔍 АНАЛИЗ РАСПРЕДЕЛЕНИЯ ДАННЫХ");
    console.log("=" .repeat(80));
    console.log();

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB");
    console.log(`   База данных: ${mongoose.connection.db.databaseName}`);
    console.log();

    const db = mongoose.connection.db;

    // 1. Анализ коллекций с пользователями
    console.log("📋 1. КОЛЛЕКЦИИ С ПОЛЬЗОВАТЕЛЯМИ");
    console.log("-".repeat(80));

    const userCollectionNames = [
      "users",
      "user",
      "accounts",
      "profiles"
    ];

    for (const collectionName of userCollectionNames) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments({});
        if (count > 0) {
          console.log(`   ✅ ${collectionName}: ${count} документов`);
          
          // Показываем пример документа
          const sample = await collection.findOne({});
          if (sample) {
            console.log(`      Пример полей:`, Object.keys(sample).slice(0, 10).join(", "));
            if (sample.email) {
              console.log(`      Пример email: ${sample.email}`);
            }
            if (sample._id) {
              console.log(`      Пример _id: ${sample._id}`);
            }
          }
        }
      } catch (error) {
        // Коллекция не существует
      }
    }
    console.log();

    // 2. Анализ всех коллекций
    console.log("📋 2. ВСЕ КОЛЛЕКЦИИ В БАЗЕ ДАННЫХ");
    console.log("-".repeat(80));

    const collections = await db.listCollections().toArray();
    console.log(`   Всего коллекций: ${collections.length}`);
    console.log();

    // Группируем по типам
    const seoCollections: string[] = [];
    const contentCollections: string[] = [];
    const userCollections: string[] = [];
    const projectCollections: string[] = [];
    const otherCollections: string[] = [];

    for (const collection of collections) {
      const name = collection.name.toLowerCase();
      if (name.includes("seo") || name.includes("backlog") || name.includes("cluster")) {
        seoCollections.push(collection.name);
      } else if (name.includes("content") || name.includes("article") || name.includes("page")) {
        contentCollections.push(collection.name);
      } else if (name.includes("user") || name.includes("account") || name.includes("profile")) {
        userCollections.push(collection.name);
      } else if (name.includes("project") || name.includes("hypothesis") || name.includes("lean") || name.includes("icp")) {
        projectCollections.push(collection.name);
      } else {
        otherCollections.push(collection.name);
      }
    }

    console.log("   📊 SEO коллекции:");
    for (const name of seoCollections) {
      const count = await db.collection(name).countDocuments({});
      console.log(`      - ${name}: ${count} документов`);
    }
    console.log();

    console.log("   📝 Content коллекции:");
    for (const name of contentCollections) {
      const count = await db.collection(name).countDocuments({});
      console.log(`      - ${name}: ${count} документов`);
    }
    console.log();

    console.log("   👤 User коллекции:");
    for (const name of userCollections) {
      const count = await db.collection(name).countDocuments({});
      console.log(`      - ${name}: ${count} документов`);
    }
    console.log();

    console.log("   📁 Project коллекции:");
    for (const name of projectCollections) {
      const count = await db.collection(name).countDocuments({});
      console.log(`      - ${name}: ${count} документов`);
    }
    console.log();

    console.log("   📦 Другие коллекции:");
    for (const name of otherCollections.slice(0, 10)) {
      const count = await db.collection(name).countDocuments({});
      console.log(`      - ${name}: ${count} документов`);
    }
    if (otherCollections.length > 10) {
      console.log(`      ... и еще ${otherCollections.length - 10} коллекций`);
    }
    console.log();

    // 3. Анализ связей между коллекциями
    console.log("📋 3. АНАЛИЗ СВЯЗЕЙ МЕЖДУ КОЛЛЕКЦИЯМИ");
    console.log("-".repeat(80));

    // Проверяем, какие коллекции ссылаются на users
    console.log("   Связи с пользователями:");
    const userIdFields = ["userId", "user", "createdBy", "updatedBy", "ownerId", "reviewerId"];
    
    for (const collectionName of collections.map(c => c.name)) {
      try {
        const sample = await db.collection(collectionName).findOne({});
        if (sample) {
          const hasUserField = userIdFields.some(field => sample[field] !== undefined);
          if (hasUserField) {
            const fields = userIdFields.filter(field => sample[field] !== undefined);
            console.log(`      ${collectionName}: ${fields.join(", ")}`);
          }
        }
      } catch (error) {
        // Пропускаем
      }
    }
    console.log();

    // 4. Проверка дублирования данных
    console.log("📋 4. ПРОВЕРКА ДУБЛИРОВАНИЯ ДАННЫХ");
    console.log("-".repeat(80));

    // Проверяем, есть ли контент в разных коллекциях
    const contentCollectionsList = [...seoCollections, ...contentCollections];
    console.log(`   Найдено ${contentCollectionsList.length} коллекций с контентом:`);
    for (const name of contentCollectionsList) {
      const count = await db.collection(name).countDocuments({});
      const sample = await db.collection(name).findOne({});
      if (sample && sample.title) {
        console.log(`      ${name}: ${count} элементов`);
        console.log(`         Пример: "${sample.title.substring(0, 50)}..."`);
      }
    }
    console.log();

    // 5. Проверка проектов и гипотез
    console.log("📋 5. ПРОЕКТЫ И ГИПОТЕЗЫ");
    console.log("-".repeat(80));

    const projectsCount = await db.collection("projects").countDocuments({});
    const hypothesesCount = await db.collection("hypotheses").countDocuments({});
    
    console.log(`   projects: ${projectsCount} документов`);
    console.log(`   hypotheses: ${hypothesesCount} документов`);
    
    // Проверяем связи
    if (projectsCount > 0) {
      const sampleProject = await db.collection("projects").findOne({});
      if (sampleProject) {
        console.log(`   Поля проекта:`, Object.keys(sampleProject).slice(0, 15).join(", "));
      }
    }
    
    if (hypothesesCount > 0) {
      const sampleHypothesis = await db.collection("hypotheses").findOne({});
      if (sampleHypothesis) {
        console.log(`   Поля гипотезы:`, Object.keys(sampleHypothesis).slice(0, 15).join(", "));
      }
    }
    console.log();

    await mongoose.disconnect();
    console.log("✅ Анализ завершен");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

analyzeDataDistribution();

