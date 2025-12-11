import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

interface CollectionConfig {
  testName: string;
  trygoName: string;
  displayName: string;
}

const collections: CollectionConfig[] = [
  { testName: "seoclusters", trygoName: "seoclusters", displayName: "seoclusters" },
  { testName: "seocontentitems", trygoName: "seocontentitems", displayName: "seocontentitems" },
  { testName: "seoAgentBacklogIdeas", trygoName: "seobacklogideas", displayName: "seoAgentBacklogIdeas/seobacklogideas" },
  { testName: "seoSprintSettings", trygoName: "seoSprintSettings", displayName: "seoSprintSettings" },
  { testName: "subscriptions", trygoName: "subscriptions", displayName: "subscriptions" },
];

async function migrateCollection(config: CollectionConfig) {
  console.log(`\n🚀 МИГРАЦИЯ ${config.displayName} ИЗ 'test' В 'trygo'`);
  console.log("=" .repeat(80));

  let testDocs: any[] = [];
  let trygoDocs: any[] = [];

  // 1. Получаем все документы из 'test'
  console.log(`📥 Загрузка документов из базы 'test' (${config.testName})...`);
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    testDocs = await testDb.collection(config.testName)
      .find({})
      .toArray();
    
    console.log(`✅ Загружено ${testDocs.length} документов из 'test'`);
    await mongoose.disconnect();
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке из 'test': ${error.message}`);
    return { success: false, error: error.message };
  }

  // 2. Получаем существующие документы из 'trygo'
  console.log(`\n📥 Загрузка существующих документов из базы 'trygo' (${config.trygoName})...`);
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    trygoDocs = await trygoDb.collection(config.trygoName)
      .find({})
      .toArray();
    
    console.log(`✅ Найдено ${trygoDocs.length} существующих документов в 'trygo'`);
    
    // Создаем Set существующих ID для быстрой проверки
    const existingIds = new Set(trygoDocs.map(d => d._id.toString()));
    
    // 3. Фильтруем документы, которых еще нет в 'trygo'
    const docsToMigrate = testDocs.filter(d => {
      const docId = d._id.toString();
      return !existingIds.has(docId);
    });
    
    console.log(`\n📊 СТАТИСТИКА:`);
    console.log(`   - Всего документов в 'test': ${testDocs.length}`);
    console.log(`   - Уже есть в 'trygo': ${testDocs.length - docsToMigrate.length}`);
    console.log(`   - К переносу: ${docsToMigrate.length}`);

    if (docsToMigrate.length === 0) {
      console.log("✅ Все документы уже есть в базе 'trygo'. Миграция не требуется.");
      await mongoose.disconnect();
      return { success: true, migrated: 0, errors: 0 };
    }

    // 4. Подготовка данных для вставки
    console.log("\n🔄 Подготовка данных для миграции...");
    
    const docsToInsert = docsToMigrate.map(doc => {
      const newDoc: any = { ...doc };
      
      // Преобразуем _id в ObjectId
      if (typeof newDoc._id === 'string') {
        newDoc._id = new mongoose.Types.ObjectId(newDoc._id);
      }
      
      // Преобразуем все возможные ObjectId поля
      const objectIdFields = [
        'projectId', 'hypothesisId', 'userId', 'createdBy', 'updatedBy',
        'backlogIdeaId', 'clusterId', 'customerSegmentId', 'projectHypothesisId'
      ];
      
      objectIdFields.forEach(field => {
        if (newDoc[field] != null && newDoc[field] !== '') {
          if (typeof newDoc[field] === 'string') {
            // Проверяем, что строка является валидным ObjectId
            if (mongoose.Types.ObjectId.isValid(newDoc[field])) {
              newDoc[field] = new mongoose.Types.ObjectId(newDoc[field]);
            } else {
              // Если невалидный ObjectId, удаляем поле или оставляем как есть
              console.warn(`   ⚠️  Невалидный ObjectId в поле ${field}: ${newDoc[field]}`);
              // Можно удалить поле или оставить как строку - оставим как строку
            }
          }
        }
      });
      
      delete newDoc.__v;
      
      return newDoc;
    });

    // 5. Вставляем документы в 'trygo'
    console.log(`\n💾 Вставка ${docsToInsert.length} документов в базу 'trygo'...`);
    
    let inserted = 0;
    let errors = 0;
    const errorsList: any[] = [];

    const batchSize = 100;
    for (let i = 0; i < docsToInsert.length; i += batchSize) {
      const batch = docsToInsert.slice(i, i + batchSize);
      
      try {
        const result = await trygoDb.collection(config.trygoName).insertMany(batch, {
          ordered: false,
        });
        inserted += result.insertedCount;
        console.log(`   ✅ Вставлено ${result.insertedCount} документов (${i + 1}-${Math.min(i + batchSize, docsToInsert.length)} из ${docsToInsert.length})`);
      } catch (error: any) {
        if (error.writeErrors) {
          errors += error.writeErrors.length;
          error.writeErrors.forEach((err: any) => {
            errorsList.push({
              index: err.index,
              code: err.code,
              message: err.errmsg || err.message,
            });
          });
          inserted += error.result.insertedCount || 0;
          console.log(`   ⚠️  Вставлено ${error.result.insertedCount || 0} из ${batch.length}, ошибок: ${error.writeErrors.length}`);
        } else {
          errors++;
          errorsList.push({ message: error.message });
          console.log(`   ❌ Ошибка при вставке батча: ${error.message}`);
        }
      }
    }

    // 6. Итоговая статистика
    console.log("\n" + "=" .repeat(80));
    console.log(`📊 ИТОГИ МИГРАЦИИ ${config.displayName}:`);
    console.log("=" .repeat(80));
    console.log(`✅ Успешно перенесено: ${inserted} документов`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`📦 Всего в 'trygo' теперь: ${trygoDocs.length + inserted} документов`);
    
    if (errorsList.length > 0 && errorsList.length <= 10) {
      console.log("\n⚠️  ДЕТАЛИ ОШИБОК:");
      errorsList.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.message || JSON.stringify(err)}`);
      });
    }

    // 7. Проверка после миграции
    const finalCount = await trygoDb.collection(config.trygoName).countDocuments({});
    console.log(`\n🔍 Проверка: Всего документов в 'trygo': ${finalCount}`);
    
    await mongoose.disconnect();
    return { success: true, migrated: inserted, errors };
  } catch (error: any) {
    console.error(`❌ Критическая ошибка: ${error.message}`);
    await mongoose.disconnect();
    return { success: false, error: error.message };
  }
}

async function migrateAllSeoCollections() {
  console.log("🚀 МИГРАЦИЯ ВСЕХ SEO КОЛЛЕКЦИЙ ИЗ 'test' В 'trygo'");
  console.log("=" .repeat(80));
  console.log();

  const results: Record<string, any> = {};

  for (const config of collections) {
    const result = await migrateCollection(config);
    results[config.displayName] = result;
  }

  // Итоговый отчет
  console.log("\n\n" + "=" .repeat(80));
  console.log("📊 ИТОГОВЫЙ ОТЧЕТ ПО ВСЕМ КОЛЛЕКЦИЯМ:");
  console.log("=" .repeat(80));
  
  Object.entries(results).forEach(([name, result]) => {
    if (result.success) {
      console.log(`✅ ${name}: ${result.migrated} документов, ${result.errors} ошибок`);
    } else {
      console.log(`❌ ${name}: Ошибка - ${result.error}`);
    }
  });
  
  console.log("\n✅ Миграция всех коллекций завершена!");
}

migrateAllSeoCollections();

