import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// URI для проверки текущей конфигурации
const currentMongoUri = process.env.MONGO_URI || "";
// Если URI заканчивается на /, добавляем trygo, иначе заменяем последний сегмент
let trygoUri = currentMongoUri;
if (trygoUri.endsWith("/")) {
  trygoUri = trygoUri + "trygo";
} else if (trygoUri.includes("/") && !trygoUri.match(/\/[^/]+\?/)) {
  // Если есть / но нет ? после последнего сегмента, заменяем последний сегмент
  trygoUri = trygoUri.replace(/\/[^/]+$/, "/trygo");
} else {
  // Если есть параметры, заменяем сегмент перед ?
  trygoUri = trygoUri.replace(/\/([^/?]+)(\?|$)/, "/trygo$2");
}

async function updateTrygoBackendConfig() {
  console.log("🔧 ОБНОВЛЕНИЕ КОНФИГУРАЦИИ TRYGO-Backend");
  console.log("=" .repeat(80));
  console.log();

  // 1. Проверка текущей конфигурации
  console.log("📋 1. ТЕКУЩАЯ КОНФИГУРАЦИЯ");
  console.log("-".repeat(80));
  
  const envPath = path.join(process.cwd(), "..", "TRYGO-Backend", ".env");
  
  if (!fs.existsSync(envPath)) {
    console.log(`❌ Файл .env не найден: ${envPath}`);
    return;
  }
  
  const envContent = fs.readFileSync(envPath, "utf-8");
  const mongoUriMatch = envContent.match(/MONGO_URI=(.+)/);
  
  if (mongoUriMatch) {
    const currentUri = mongoUriMatch[1].trim();
    console.log(`Текущий MONGO_URI: ${currentUri.replace(/\/\/.*@/, "//***:***@")}`);
    
    // Извлекаем имя базы данных
    const dbMatch = currentUri.match(/mongodb[^/]+\/([^?]+)/);
    const currentDb = dbMatch ? dbMatch[1] : "не указана (используется default)";
    console.log(`Текущая база данных: ${currentDb}`);
    console.log();
    
    if (currentDb === "trygo") {
      console.log("✅ Уже настроено на базу 'trygo'!");
      return;
    }
  } else {
    console.log("⚠️  MONGO_URI не найден в .env");
    console.log();
  }

  // 2. Проверка подключения к trygo
  console.log("📋 2. ПРОВЕРКА ПОДКЛЮЧЕНИЯ К 'trygo'");
  console.log("-".repeat(80));
  
  try {
    await mongoose.connect(trygoUri);
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    console.log(`✅ Подключено к базе: ${dbName}`);
    
    // Проверяем наличие пользователя
    const user = await db.collection("users").findOne({ email: "sigayyury5@gmail.com" });
    if (user) {
      console.log(`✅ Пользователь найден в базе 'trygo'`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
    } else {
      console.log(`⚠️  Пользователь не найден в базе 'trygo'`);
    }
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`❌ Ошибка подключения: ${error.message}`);
    console.log();
  }

  // 3. Обновление конфигурации
  console.log("📋 3. ОБНОВЛЕНИЕ КОНФИГУРАЦИИ");
  console.log("-".repeat(80));
  
  const newMongoUri = trygoUri;
  let updatedContent = envContent;
  
  if (mongoUriMatch) {
    // Заменяем существующий MONGO_URI
    updatedContent = envContent.replace(
      /MONGO_URI=(.+)/,
      `MONGO_URI=${newMongoUri}`
    );
    console.log(`✅ Обновлен MONGO_URI`);
  } else {
    // Добавляем MONGO_URI
    updatedContent += `\nMONGO_URI=${newMongoUri}\n`;
    console.log(`✅ Добавлен MONGO_URI`);
  }
  
  // Создаем бэкап
  const backupPath = envPath + `.backup.${Date.now()}`;
  fs.writeFileSync(backupPath, envContent, "utf-8");
  console.log(`💾 Бэкап создан: ${backupPath}`);
  
  // Сохраняем обновленный файл
  fs.writeFileSync(envPath, updatedContent, "utf-8");
  console.log(`✅ Файл .env обновлен`);
  console.log();
  
  // 4. Проверка обновленной конфигурации
  console.log("📋 4. ПРОВЕРКА ОБНОВЛЕННОЙ КОНФИГУРАЦИИ");
  console.log("-".repeat(80));
  
  const updatedEnvContent = fs.readFileSync(envPath, "utf-8");
  const updatedMatch = updatedEnvContent.match(/MONGO_URI=(.+)/);
  
  if (updatedMatch) {
    const updatedUri = updatedMatch[1].trim();
    const updatedDbMatch = updatedUri.match(/mongodb[^/]+\/([^?]+)/);
    const updatedDb = updatedDbMatch ? updatedDbMatch[1] : "не указана";
    
    console.log(`MONGO_URI: ${updatedUri.replace(/\/\/.*@/, "//***:***@")}`);
    console.log(`База данных: ${updatedDb}`);
    
    if (updatedDb === "trygo") {
      console.log(`✅ Конфигурация обновлена успешно!`);
    } else {
      console.log(`⚠️  База данных не 'trygo': ${updatedDb}`);
    }
  }
  
  console.log();
  console.log("=" .repeat(80));
  console.log("✅ КОНФИГУРАЦИЯ ОБНОВЛЕНА");
  console.log("=" .repeat(80));
  console.log();
  console.log("⚠️  ВАЖНО: Перезапустите TRYGO-Backend для применения изменений!");
}

updateTrygoBackendConfig();

