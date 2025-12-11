import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

async function migrateHypothesesCores() {
  console.log("🚀 МИГРАЦИЯ hypothesesCores ИЗ 'test' В 'trygo'");
  console.log("=" .repeat(80));
  console.log();

  let testCores: any[] = [];
  let trygoCores: any[] = [];

  // 1. Получаем все cores из 'test'
  console.log("📥 Загрузка cores из базы 'test'...");
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    testCores = await testDb.collection("hypothesesCores")
      .find({})
      .toArray();
    
    console.log(`✅ Загружено ${testCores.length} cores из 'test'`);
    await mongoose.disconnect();
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке из 'test': ${error.message}`);
    process.exit(1);
  }

  // 2. Получаем существующие cores из 'trygo'
  console.log("\n📥 Загрузка существующих cores из базы 'trygo'...");
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    trygoCores = await trygoDb.collection("hypothesesCores")
      .find({})
      .toArray();
    
    console.log(`✅ Найдено ${trygoCores.length} существующих cores в 'trygo'`);
    
    // Создаем Set существующих ID для быстрой проверки
    const existingIds = new Set(trygoCores.map(c => c._id.toString()));
    
    // 3. Фильтруем cores, которых еще нет в 'trygo'
    const coresToMigrate = testCores.filter(c => {
      const coreId = c._id.toString();
      return !existingIds.has(coreId);
    });
    
    console.log(`\n📊 СТАТИСТИКА:`);
    console.log(`   - Всего cores в 'test': ${testCores.length}`);
    console.log(`   - Уже есть в 'trygo': ${testCores.length - coresToMigrate.length}`);
    console.log(`   - К переносу: ${coresToMigrate.length}`);
    console.log();

    if (coresToMigrate.length === 0) {
      console.log("✅ Все cores уже есть в базе 'trygo'. Миграция не требуется.");
      await mongoose.disconnect();
      return;
    }

    // 4. Подготовка данных для вставки
    console.log("🔄 Подготовка данных для миграции...");
    
    const coresToInsert = coresToMigrate.map(core => {
      const doc: any = { ...core };
      
      // Преобразуем _id в ObjectId
      if (typeof doc._id === 'string') {
        doc._id = new mongoose.Types.ObjectId(doc._id);
      }
      
      // Преобразуем projectHypothesisId в ObjectId
      if (doc.projectHypothesisId) {
        if (typeof doc.projectHypothesisId === 'string') {
          doc.projectHypothesisId = new mongoose.Types.ObjectId(doc.projectHypothesisId);
        }
      }
      
      // Преобразуем userId в ObjectId (если есть)
      if (doc.userId) {
        if (typeof doc.userId === 'string') {
          doc.userId = new mongoose.Types.ObjectId(doc.userId);
        }
      }
      
      // Обрабатываем вложенные объекты в customerSegments (если есть)
      if (doc.customerSegments && Array.isArray(doc.customerSegments)) {
        doc.customerSegments = doc.customerSegments.map((seg: any) => {
          if (seg._id && typeof seg._id === 'string') {
            seg._id = new mongoose.Types.ObjectId(seg._id);
          }
          return seg;
        });
      }
      
      delete doc.__v;
      
      return doc;
    });

    // 5. Вставляем cores в 'trygo'
    console.log(`\n💾 Вставка ${coresToInsert.length} cores в базу 'trygo'...`);
    
    let inserted = 0;
    let errors = 0;
    const errorsList: any[] = [];

    const batchSize = 100;
    for (let i = 0; i < coresToInsert.length; i += batchSize) {
      const batch = coresToInsert.slice(i, i + batchSize);
      
      try {
        const result = await trygoDb.collection("hypothesesCores").insertMany(batch, {
          ordered: false,
        });
        inserted += result.insertedCount;
        console.log(`   ✅ Вставлено ${result.insertedCount} cores (${i + 1}-${Math.min(i + batchSize, coresToInsert.length)} из ${coresToInsert.length})`);
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
    console.log("📊 ИТОГИ МИГРАЦИИ:");
    console.log("=" .repeat(80));
    console.log(`✅ Успешно перенесено: ${inserted} cores`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`📦 Всего в 'trygo' теперь: ${trygoCores.length + inserted} cores`);
    
    if (errorsList.length > 0) {
      console.log("\n⚠️  ДЕТАЛИ ОШИБОК:");
      errorsList.slice(0, 10).forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.message || JSON.stringify(err)}`);
      });
      if (errorsList.length > 10) {
        console.log(`   ... и еще ${errorsList.length - 10} ошибок`);
      }
    }

    // 7. Проверка после миграции
    console.log("\n🔍 ПРОВЕРКА ПОСЛЕ МИГРАЦИИ:");
    const finalCount = await trygoDb.collection("hypothesesCores").countDocuments({});
    console.log(`   Всего cores в 'trygo': ${finalCount}`);
    
    await mongoose.disconnect();
    console.log("\n✅ Миграция завершена!");
  } catch (error: any) {
    console.error(`❌ Критическая ошибка: ${error.message}`);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateHypothesesCores();

