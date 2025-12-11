import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

async function migrateProjects() {
  console.log("🚀 МИГРАЦИЯ ПРОЕКТОВ ИЗ 'test' В 'trygo'");
  console.log("=" .repeat(80));
  console.log();

  let testProjects: any[] = [];
  let trygoProjects: any[] = [];

  // 1. Получаем все проекты из 'test'
  console.log("📥 Загрузка проектов из базы 'test'...");
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    testProjects = await testDb.collection("projects")
      .find({})
      .toArray();
    
    console.log(`✅ Загружено ${testProjects.length} проектов из 'test'`);
    await mongoose.disconnect();
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке из 'test': ${error.message}`);
    process.exit(1);
  }

  // 2. Получаем существующие проекты из 'trygo'
  console.log("\n📥 Загрузка существующих проектов из базы 'trygo'...");
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    trygoProjects = await trygoDb.collection("projects")
      .find({})
      .toArray();
    
    console.log(`✅ Найдено ${trygoProjects.length} существующих проектов в 'trygo'`);
    
    // Создаем Set существующих ID для быстрой проверки
    const existingIds = new Set(trygoProjects.map(p => p._id.toString()));
    
    // 3. Фильтруем проекты, которых еще нет в 'trygo'
    const projectsToMigrate = testProjects.filter(p => {
      const projectId = p._id.toString();
      return !existingIds.has(projectId);
    });
    
    console.log(`\n📊 СТАТИСТИКА:`);
    console.log(`   - Всего проектов в 'test': ${testProjects.length}`);
    console.log(`   - Уже есть в 'trygo': ${testProjects.length - projectsToMigrate.length}`);
    console.log(`   - К переносу: ${projectsToMigrate.length}`);
    console.log();

    if (projectsToMigrate.length === 0) {
      console.log("✅ Все проекты уже есть в базе 'trygo'. Миграция не требуется.");
      await mongoose.disconnect();
      return;
    }

    // 4. Подготовка данных для вставки
    console.log("🔄 Подготовка данных для миграции...");
    
    const projectsToInsert = projectsToMigrate.map(project => {
      // Преобразуем _id и userId в ObjectId, если они строки
      const doc: any = { ...project };
      
      // Убеждаемся, что _id правильного типа
      if (typeof doc._id === 'string') {
        doc._id = new mongoose.Types.ObjectId(doc._id);
      }
      
      // Убеждаемся, что userId правильного типа
      if (doc.userId) {
        if (typeof doc.userId === 'string') {
          doc.userId = new mongoose.Types.ObjectId(doc.userId);
        }
      }
      
      // Удаляем __v если есть (версия документа Mongoose)
      delete doc.__v;
      
      return doc;
    });

    // 5. Вставляем проекты в 'trygo'
    console.log(`\n💾 Вставка ${projectsToInsert.length} проектов в базу 'trygo'...`);
    
    let inserted = 0;
    let errors = 0;
    const errorsList: any[] = [];

    // Вставляем батчами по 100 для лучшей производительности
    const batchSize = 100;
    for (let i = 0; i < projectsToInsert.length; i += batchSize) {
      const batch = projectsToInsert.slice(i, i + batchSize);
      
      try {
        const result = await trygoDb.collection("projects").insertMany(batch, {
          ordered: false, // Продолжать при ошибках
        });
        inserted += result.insertedCount;
        console.log(`   ✅ Вставлено ${result.insertedCount} проектов (${i + 1}-${Math.min(i + batchSize, projectsToInsert.length)} из ${projectsToInsert.length})`);
      } catch (error: any) {
        // При ordered: false ошибки могут быть в result.writeErrors
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
          errorsList.push({
            message: error.message,
          });
          console.log(`   ❌ Ошибка при вставке батча: ${error.message}`);
        }
      }
    }

    // 6. Итоговая статистика
    console.log("\n" + "=" .repeat(80));
    console.log("📊 ИТОГИ МИГРАЦИИ:");
    console.log("=" .repeat(80));
    console.log(`✅ Успешно перенесено: ${inserted} проектов`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`📦 Всего в 'trygo' теперь: ${trygoProjects.length + inserted} проектов`);
    
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
    const finalCount = await trygoDb.collection("projects").countDocuments({});
    console.log(`   Всего проектов в 'trygo': ${finalCount}`);
    
    // Проверяем проекты пользователя
    const userId = "686773b5773b5947fed60a68";
    const userProjectsCount = await trygoDb.collection("projects")
      .countDocuments({ userId: new mongoose.Types.ObjectId(userId) });
    console.log(`   Проектов пользователя (${userId}): ${userProjectsCount}`);
    
    await mongoose.disconnect();
    console.log("\n✅ Миграция завершена!");
  } catch (error: any) {
    console.error(`❌ Критическая ошибка: ${error.message}`);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateProjects();

