import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

async function migrateHypothesesPersonProfiles() {
  console.log("🚀 МИГРАЦИЯ hypothesesPersonProfiles ИЗ 'test' В 'trygo'");
  console.log("=" .repeat(80));
  console.log();

  let testProfiles: any[] = [];
  let trygoProfiles: any[] = [];

  // 1. Получаем все профили из 'test'
  console.log("📥 Загрузка профилей из базы 'test'...");
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    testProfiles = await testDb.collection("hypothesesPersonProfiles")
      .find({})
      .toArray();
    
    console.log(`✅ Загружено ${testProfiles.length} профилей из 'test'`);
    await mongoose.disconnect();
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке из 'test': ${error.message}`);
    process.exit(1);
  }

  // 2. Получаем существующие профили из 'trygo'
  console.log("\n📥 Загрузка существующих профилей из базы 'trygo'...");
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    trygoProfiles = await trygoDb.collection("hypothesesPersonProfiles")
      .find({})
      .toArray();
    
    console.log(`✅ Найдено ${trygoProfiles.length} существующих профилей в 'trygo'`);
    
    // Создаем Set существующих ID для быстрой проверки
    const existingIds = new Set(trygoProfiles.map(p => p._id.toString()));
    
    // 3. Фильтруем профили, которых еще нет в 'trygo'
    const profilesToMigrate = testProfiles.filter(p => {
      const profileId = p._id.toString();
      return !existingIds.has(profileId);
    });
    
    console.log(`\n📊 СТАТИСТИКА:`);
    console.log(`   - Всего профилей в 'test': ${testProfiles.length}`);
    console.log(`   - Уже есть в 'trygo': ${testProfiles.length - profilesToMigrate.length}`);
    console.log(`   - К переносу: ${profilesToMigrate.length}`);
    console.log();

    if (profilesToMigrate.length === 0) {
      console.log("✅ Все профили уже есть в базе 'trygo'. Миграция не требуется.");
      await mongoose.disconnect();
      return;
    }

    // 4. Подготовка данных для вставки
    console.log("🔄 Подготовка данных для миграции...");
    
    const profilesToInsert = profilesToMigrate.map(profile => {
      const doc: any = { ...profile };
      
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
      
      // Преобразуем customerSegmentId в ObjectId (если есть)
      if (doc.customerSegmentId) {
        if (typeof doc.customerSegmentId === 'string') {
          doc.customerSegmentId = new mongoose.Types.ObjectId(doc.customerSegmentId);
        }
      }
      
      delete doc.__v;
      
      return doc;
    });

    // 5. Вставляем профили в 'trygo'
    console.log(`\n💾 Вставка ${profilesToInsert.length} профилей в базу 'trygo'...`);
    
    let inserted = 0;
    let errors = 0;
    const errorsList: any[] = [];

    const batchSize = 100;
    for (let i = 0; i < profilesToInsert.length; i += batchSize) {
      const batch = profilesToInsert.slice(i, i + batchSize);
      
      try {
        const result = await trygoDb.collection("hypothesesPersonProfiles").insertMany(batch, {
          ordered: false,
        });
        inserted += result.insertedCount;
        console.log(`   ✅ Вставлено ${result.insertedCount} профилей (${i + 1}-${Math.min(i + batchSize, profilesToInsert.length)} из ${profilesToInsert.length})`);
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
    console.log(`✅ Успешно перенесено: ${inserted} профилей`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`📦 Всего в 'trygo' теперь: ${trygoProfiles.length + inserted} профилей`);
    
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
    const finalCount = await trygoDb.collection("hypothesesPersonProfiles").countDocuments({});
    console.log(`   Всего профилей в 'trygo': ${finalCount}`);
    
    await mongoose.disconnect();
    console.log("\n✅ Миграция завершена!");
  } catch (error: any) {
    console.error(`❌ Критическая ошибка: ${error.message}`);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateHypothesesPersonProfiles();

