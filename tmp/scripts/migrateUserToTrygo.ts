import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";
const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";

const userEmail = "sigayyury5@gmail.com";

interface MigrationResult {
  success: boolean;
  userId?: string;
  collectionsMigrated: string[];
  errors: string[];
}

async function migrateUserToTrygo() {
  console.log("🚀 МИГРАЦИЯ ПОЛЬЗОВАТЕЛЯ В БАЗУ 'trygo'");
  console.log("=" .repeat(80));
  console.log();

  const result: MigrationResult = {
    success: false,
    collectionsMigrated: [],
    errors: []
  };

  try {
    // 1. Подключение к базе 'test' и поиск пользователя
    console.log("📋 1. ПОИСК ПОЛЬЗОВАТЕЛЯ В БАЗЕ 'test'");
    console.log("-".repeat(80));
    
    await mongoose.connect(testUri);
    const testDb = mongoose.connection.db;
    
    const user = await testDb.collection("users").findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ Пользователь ${userEmail} не найден в базе 'test'`);
      result.errors.push(`Пользователь не найден: ${userEmail}`);
      await mongoose.disconnect();
      return result;
    }
    
    result.userId = user._id.toString();
    console.log(`✅ Пользователь найден:`);
    console.log(`   ID: ${result.userId}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || "N/A"}`);
    console.log();
    
    await mongoose.disconnect();

    // 2. Проверка, существует ли пользователь уже в 'trygo'
    console.log("📋 2. ПРОВЕРКА БАЗЫ 'trygo'");
    console.log("-".repeat(80));
    
    await mongoose.connect(trygoUri);
    const trygoDb = mongoose.connection.db;
    
    const existingUser = await trygoDb.collection("users").findOne({ 
      $or: [
        { _id: user._id },
        { email: userEmail }
      ]
    });
    
    if (existingUser) {
      console.log(`⚠️  Пользователь уже существует в базе 'trygo'`);
      console.log(`   ID: ${existingUser._id}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log();
      console.log("❓ Перезаписать существующего пользователя? (в скрипте установлено: НЕТ)");
      console.log("   Если нужно, измените скрипт и установите forceOverwrite = true");
      
      // Можно добавить опцию forceOverwrite
      const forceOverwrite = false;
      if (!forceOverwrite) {
        result.errors.push("Пользователь уже существует в trygo");
        await mongoose.disconnect();
        return result;
      }
    }
    
    await mongoose.disconnect();

    // 3. Перенос пользователя
    console.log("📋 3. ПЕРЕНОС ПОЛЬЗОВАТЕЛЯ");
    console.log("-".repeat(80));
    
    await mongoose.connect(testUri);
    const testDb2 = mongoose.connection.db;
    const userDoc = await testDb2.collection("users").findOne({ email: userEmail });
    
    if (!userDoc) {
      result.errors.push("Пользователь не найден при повторной проверке");
      await mongoose.disconnect();
      return result;
    }
    
    await mongoose.disconnect();
    
    // Подключаемся к trygo и вставляем пользователя
    await mongoose.connect(trygoUri);
    const trygoDb2 = mongoose.connection.db;
    
    // Удаляем существующего пользователя, если есть (если forceOverwrite)
    if (existingUser) {
      await trygoDb2.collection("users").deleteOne({ _id: userDoc._id });
      console.log(`   Удален существующий пользователь`);
    }
    
    // Вставляем пользователя с сохранением _id
    await trygoDb2.collection("users").insertOne(userDoc);
    console.log(`✅ Пользователь перенесен в 'trygo'`);
    console.log(`   ID сохранен: ${userDoc._id}`);
    result.collectionsMigrated.push("users");
    console.log();
    
    await mongoose.disconnect();

    // 4. Проверка связанных данных
    console.log("📋 4. ПРОВЕРКА СВЯЗАННЫХ ДАННЫХ");
    console.log("-".repeat(80));
    
    await mongoose.connect(testUri);
    const testDb3 = mongoose.connection.db;
    
    // Проверяем проекты пользователя
    const userProjects = await testDb3.collection("projects")
      .find({ userId: result.userId })
      .toArray();
    console.log(`   Проектов пользователя в 'test': ${userProjects.length}`);
    
    // Проверяем подписки
    const userSubscriptions = await testDb3.collection("subscriptions")
      .find({ userId: result.userId })
      .toArray();
    console.log(`   Подписок пользователя в 'test': ${userSubscriptions.length}`);
    
    await mongoose.disconnect();

    // 5. Проверка проектов в trygo, которые ссылаются на этого пользователя
    console.log("📋 5. ПРОВЕРКА ПРОЕКТОВ В 'trygo'");
    console.log("-".repeat(80));
    
    await mongoose.connect(trygoUri);
    const trygoDb3 = mongoose.connection.db;
    
    const trygoProjects = await trygoDb3.collection("projects")
      .find({ userId: result.userId })
      .toArray();
    console.log(`   Проектов пользователя в 'trygo': ${trygoProjects.length}`);
    
    if (trygoProjects.length > 0) {
      console.log(`   ✅ Проекты уже ссылаются на этого пользователя!`);
      trygoProjects.forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.title || p._id}`);
      });
    } else {
      console.log(`   ⚠️  Проекты в 'trygo' не ссылаются на этого пользователя`);
    }
    
    await mongoose.disconnect();

    // 6. Финальная проверка
    console.log("📋 6. ФИНАЛЬНАЯ ПРОВЕРКА");
    console.log("-".repeat(80));
    
    await mongoose.connect(trygoUri);
    const trygoDb4 = mongoose.connection.db;
    
    const finalCheck = await trygoDb4.collection("users").findOne({ 
      $or: [
        { _id: userDoc._id },
        { email: userEmail }
      ]
    });
    
    if (finalCheck) {
      console.log(`✅ Пользователь успешно перенесен!`);
      console.log(`   ID: ${finalCheck._id}`);
      console.log(`   Email: ${finalCheck.email}`);
      result.success = true;
    } else {
      console.log(`❌ Пользователь не найден после переноса!`);
      result.errors.push("Пользователь не найден после переноса");
    }
    
    await mongoose.disconnect();

    // 7. Сохранение отчета
    const reportPath = path.join(process.cwd(), "..", "logs", `user-migration-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      userEmail,
      userId: result.userId,
      result
    }, null, 2), "utf-8");
    console.log();
    console.log(`💾 Отчет сохранен: ${reportPath}`);

  } catch (error: any) {
    console.error("❌ Ошибка при миграции:", error);
    result.errors.push(error.message);
    await mongoose.disconnect();
  }

  console.log();
  console.log("=" .repeat(80));
  if (result.success) {
    console.log("✅ МИГРАЦИЯ ЗАВЕРШЕНА УСПЕШНО");
  } else {
    console.log("❌ МИГРАЦИЯ ЗАВЕРШЕНА С ОШИБКАМИ");
    console.log("Ошибки:", result.errors);
  }
  console.log("=" .repeat(80));

  return result;
}

migrateUserToTrygo().then(result => {
  process.exit(result.success ? 0 : 1);
});

