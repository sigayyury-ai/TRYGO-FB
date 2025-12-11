import "dotenv/config";
import mongoose from "mongoose";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

async function migrateUsers() {
  console.log("🚀 МИГРАЦИЯ ПОЛЬЗОВАТЕЛЕЙ (users) ИЗ 'test' В 'trygo'");
  console.log("=" .repeat(80));
  console.log();

  let testUsers: any[] = [];
  let trygoUsers: any[] = [];

  // 1. Получаем всех пользователей из 'test'
  console.log("📥 Загрузка пользователей из базы 'test'...");
  try {
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    testUsers = await testDb.collection("users")
      .find({})
      .toArray();
    
    console.log(`✅ Загружено ${testUsers.length} пользователей из 'test'`);
    await mongoose.disconnect();
  } catch (error: any) {
    console.error(`❌ Ошибка при загрузке из 'test': ${error.message}`);
    process.exit(1);
  }

  // 2. Получаем существующих пользователей из 'trygo'
  console.log("\n📥 Загрузка существующих пользователей из базы 'trygo'...");
  try {
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    trygoUsers = await trygoDb.collection("users")
      .find({})
      .toArray();
    
    console.log(`✅ Найдено ${trygoUsers.length} существующих пользователей в 'trygo'`);
    
    // Создаем Set существующих ID для быстрой проверки
    const existingIds = new Set(trygoUsers.map(u => u._id.toString()));
    
    // Также проверяем по email для дополнительной валидации
    const existingEmails = new Set(
      trygoUsers
        .filter(u => u.email)
        .map(u => u.email.toLowerCase())
    );
    
    // 3. Фильтруем пользователей, которых еще нет в 'trygo'
    const usersToMigrate = testUsers.filter(u => {
      const userId = u._id.toString();
      const userEmail = u.email ? u.email.toLowerCase() : null;
      
      // Проверяем по ID (основная проверка)
      if (existingIds.has(userId)) {
        return false;
      }
      
      // Дополнительная проверка по email (если есть)
      if (userEmail && existingEmails.has(userEmail)) {
        console.log(`   ⚠️  Пропущен пользователь с ID ${userId} (дубликат email: ${userEmail})`);
        return false;
      }
      
      return true;
    });
    
    console.log(`\n📊 СТАТИСТИКА:`);
    console.log(`   - Всего пользователей в 'test': ${testUsers.length}`);
    console.log(`   - Уже есть в 'trygo': ${testUsers.length - usersToMigrate.length}`);
    console.log(`   - К переносу: ${usersToMigrate.length}`);
    console.log();

    if (usersToMigrate.length === 0) {
      console.log("✅ Все пользователи уже есть в базе 'trygo'. Миграция не требуется.");
      await mongoose.disconnect();
      return;
    }

    // 4. Подготовка данных для вставки
    console.log("🔄 Подготовка данных для миграции...");
    
    const usersToInsert = usersToMigrate.map(user => {
      // Преобразуем _id в ObjectId, если он строка
      const doc: any = { ...user };
      
      // Убеждаемся, что _id правильного типа
      if (typeof doc._id === 'string') {
        doc._id = new mongoose.Types.ObjectId(doc._id);
      }
      
      // Удаляем __v если есть (версия документа Mongoose)
      delete doc.__v;
      
      return doc;
    });

    // 5. Вставляем пользователей в 'trygo'
    console.log(`\n💾 Вставка ${usersToInsert.length} пользователей в базу 'trygo'...`);
    
    let inserted = 0;
    let errors = 0;
    const errorsList: any[] = [];

    // Вставляем батчами по 100 для лучшей производительности
    const batchSize = 100;
    for (let i = 0; i < usersToInsert.length; i += batchSize) {
      const batch = usersToInsert.slice(i, i + batchSize);
      
      try {
        const result = await trygoDb.collection("users").insertMany(batch, {
          ordered: false, // Продолжать при ошибках
        });
        inserted += result.insertedCount;
        console.log(`   ✅ Вставлено ${result.insertedCount} пользователей (${i + 1}-${Math.min(i + batchSize, usersToInsert.length)} из ${usersToInsert.length})`);
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
    console.log(`✅ Успешно перенесено: ${inserted} пользователей`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`📦 Всего в 'trygo' теперь: ${trygoUsers.length + inserted} пользователей`);
    
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
    const finalCount = await trygoDb.collection("users").countDocuments({});
    console.log(`   Всего пользователей в 'trygo': ${finalCount}`);
    
    // Проверяем конкретного пользователя
    const userEmail = "sigayyury5@gmail.com";
    const user = await trygoDb.collection("users")
      .findOne({ email: userEmail });
    
    if (user) {
      console.log(`   ✅ Пользователь '${userEmail}' найден (ID: ${user._id})`);
    } else {
      console.log(`   ⚠️  Пользователь '${userEmail}' не найден`);
    }
    
    // Статистика по ролям
    const roleStats = await trygoDb.collection("users")
      .aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      .toArray();
    
    console.log("\n   Статистика по ролям:");
    roleStats.forEach(stat => {
      console.log(`      ${stat._id || "без роли"}: ${stat.count}`);
    });
    
    await mongoose.disconnect();
    console.log("\n✅ Миграция завершена!");
  } catch (error: any) {
    console.error(`❌ Критическая ошибка: ${error.message}`);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateUsers();

