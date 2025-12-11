import "dotenv/config";
import fs from "fs";
import path from "path";

async function analyzeDatabaseConfig() {
  console.log("🔍 АНАЛИЗ КОНФИГУРАЦИИ БАЗ ДАННЫХ");
  console.log("=" .repeat(80));
  console.log();

  const backendPath = path.join(process.cwd());
  const rootPath = path.join(backendPath, "..");

  // 1. Проверка .env файлов
  console.log("📋 1. ПРОВЕРКА .env ФАЙЛОВ");
  console.log("-".repeat(80));

  const envFiles = [
    { path: path.join(backendPath, ".env"), name: "backend/.env" },
    { path: path.join(backendPath, ".env.local"), name: "backend/.env.local" },
    { path: path.join(rootPath, ".env"), name: ".env (root)" },
    { path: path.join(rootPath, ".env.local"), name: ".env.local (root)" }
  ];

  const envConfigs: Array<{
    file: string;
    exists: boolean;
    mongoUri?: string;
    database?: string;
  }> = [];

  for (const file of envFiles) {
    const exists = fs.existsSync(file.path);
    let mongoUri: string | undefined;
    let database: string | undefined;

    if (exists) {
      try {
        const content = fs.readFileSync(file.path, "utf-8");
        const mongoMatch = content.match(/MONGODB_URI=(.+)/);
        if (mongoMatch) {
          mongoUri = mongoMatch[1].trim();
          // Извлекаем имя базы данных из URI
          const dbMatch = mongoUri.match(/mongodb[^/]+\/([^?]+)/);
          if (dbMatch) {
            database = dbMatch[1];
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Ошибка чтения ${file.name}: ${error}`);
      }
    }

    envConfigs.push({
      file: file.name,
      exists,
      mongoUri: mongoUri ? mongoUri.replace(/\/\/.*@/, "//***:***@") : undefined,
      database
    });

    console.log(`   ${exists ? "✅" : "❌"} ${file.name}`);
    if (exists && mongoUri) {
      console.log(`      URI: ${mongoUri.replace(/\/\/.*@/, "//***:***@")}`);
      console.log(`      База данных: ${database || "не указана"}`);
    } else if (exists) {
      console.log(`      ⚠️  MONGODB_URI не найден`);
    }
    console.log();
  }

  // 2. Проверка конфигурации в коде
  console.log("📋 2. ПРОВЕРКА КОНФИГУРАЦИИ В КОДЕ");
  console.log("-".repeat(80));

  const configFiles = [
    { path: path.join(backendPath, "src/config/env.ts"), name: "backend/src/config/env.ts" },
    { path: path.join(backendPath, "src/db/connection.ts"), name: "backend/src/db/connection.ts" }
  ];

  for (const file of configFiles) {
    if (fs.existsSync(file.path)) {
      console.log(`   ✅ ${file.name}`);
      const content = fs.readFileSync(file.path, "utf-8");
      
      // Ищем использование MONGODB_URI
      if (content.includes("MONGODB_URI") || content.includes("mongoUri")) {
        console.log(`      Использует MONGODB_URI из process.env`);
      }
      
      // Ищем загрузку .env файлов
      if (content.includes(".env.local")) {
        console.log(`      Загружает .env.local (переопределяет .env)`);
      }
    } else {
      console.log(`   ❌ ${file.name} не найден`);
    }
    console.log();
  }

  // 3. Проверка других сервисов
  console.log("📋 3. ПРОВЕРКА ДРУГИХ СЕРВИСОВ");
  console.log("-".repeat(80));

  const otherServices = [
    { path: path.join(rootPath, "TRYGO-Backend"), name: "TRYGO-Backend" },
    { path: path.join(rootPath, "semantics-service"), name: "semantics-service" }
  ];

  for (const service of otherServices) {
    if (fs.existsSync(service.path)) {
      const envPath = path.join(service.path, ".env");
      const envLocalPath = path.join(service.path, ".env.local");
      
      console.log(`   📁 ${service.name}:`);
      
      if (fs.existsSync(envPath)) {
        console.log(`      ✅ .env существует`);
        try {
          const content = fs.readFileSync(envPath, "utf-8");
          const mongoMatch = content.match(/MONGODB_URI=(.+)/);
          if (mongoMatch) {
            const uri = mongoMatch[1].trim();
            const dbMatch = uri.match(/mongodb[^/]+\/([^?]+)/);
            console.log(`      База данных: ${dbMatch ? dbMatch[1] : "не указана"}`);
          }
        } catch (error) {
          console.log(`      ⚠️  Ошибка чтения`);
        }
      }
      
      if (fs.existsSync(envLocalPath)) {
        console.log(`      ✅ .env.local существует`);
        try {
          const content = fs.readFileSync(envLocalPath, "utf-8");
          const mongoMatch = content.match(/MONGODB_URI=(.+)/);
          if (mongoMatch) {
            const uri = mongoMatch[1].trim();
            const dbMatch = uri.match(/mongodb[^/]+\/([^?]+)/);
            console.log(`      База данных: ${dbMatch ? dbMatch[1] : "не указана"} (переопределяет .env)`);
          }
        } catch (error) {
          console.log(`      ⚠️  Ошибка чтения`);
        }
      }
    }
    console.log();
  }

  // 4. Рекомендации
  console.log("📋 4. РЕКОМЕНДАЦИИ");
  console.log("=" .repeat(80));
  console.log();

  const databases = envConfigs
    .filter(c => c.database)
    .map(c => c.database!)
    .filter((v, i, a) => a.indexOf(v) === i);

  console.log(`Найдено ${databases.length} разных баз данных: ${databases.join(", ")}`);
  console.log();

  if (databases.length > 1) {
    console.log("⚠️  ПРОБЛЕМА: Обнаружено несколько разных баз данных!");
    console.log();
    console.log("Рекомендации:");
    console.log("1. Определите, какая база данных должна использоваться в продакшене");
    console.log("2. Убедитесь, что все .env файлы указывают на одну и ту же базу данных");
    console.log("3. Используйте .env.local только для локальной разработки");
    console.log("4. В продакшене используйте переменные окружения сервера (Render, Heroku и т.д.)");
    console.log();
    console.log("Структура должна быть:");
    console.log("  - .env - база данных для разработки (trygo)");
    console.log("  - .env.local - переопределения для локальной разработки (опционально)");
    console.log("  - Production - переменные окружения на сервере");
  } else if (databases.length === 1) {
    console.log(`✅ Все файлы указывают на одну базу данных: ${databases[0]}`);
    console.log();
    console.log("Рекомендации:");
    console.log("1. Убедитесь, что это правильная база данных для продакшена");
    console.log("2. Проверьте, что в продакшене используются переменные окружения сервера");
  } else {
    console.log("⚠️  Не удалось определить базы данных из .env файлов");
  }

  // 5. Создание отчета
  const reportPath = path.join(rootPath, "logs", `database-config-analysis-${Date.now()}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    envFiles: envConfigs,
    databases,
    recommendations: databases.length > 1 ? "Обнаружено несколько баз данных. Необходимо унифицировать конфигурацию." : "Все файлы указывают на одну базу данных."
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log();
  console.log(`💾 Отчет сохранен: ${reportPath}`);
}

analyzeDatabaseConfig();

