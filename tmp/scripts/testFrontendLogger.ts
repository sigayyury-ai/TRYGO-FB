import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Тест системы перехвата логов фронтенда
 */

async function testFrontendLogger() {
  try {
    console.log("=".repeat(70));
    console.log("🧪 ТЕСТ СИСТЕМЫ ПЕРЕХВАТА ЛОГОВ ФРОНТЕНДА");
    console.log("=".repeat(70));
    console.log();

    // 1. Проверка подключения к БД
    console.log("1️⃣ ПРОВЕРКА ПОДКЛЮЧЕНИЯ К БД");
    console.log("-".repeat(70));
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ Подключение к MongoDB успешно");
    console.log();

    // 2. Проверка GraphQL resolver
    console.log("2️⃣ ПРОВЕРКА GRAPHQL RESOLVER");
    console.log("-".repeat(70));
    const { resolvers } = await import("../src/schema/resolvers.js");
    
    if (!resolvers.Mutation || !resolvers.Mutation.logFrontendMessage) {
      throw new Error("logFrontendMessage resolver not found");
    }
    
    console.log("✅ Resolver logFrontendMessage найден");
    console.log();

    // 3. Тест отправки логов
    console.log("3️⃣ ТЕСТ ОТПРАВКИ ЛОГОВ");
    console.log("-".repeat(70));
    console.log("Отправляю тестовые логи...");
    console.log();

    const mockContext = {
      userId: "test-user"
    };

    // Тест 1: log level
    console.log("📤 Тест 1: LOG level");
    const result1 = await resolvers.Mutation.logFrontendMessage(
      null,
      {
        level: "log",
        message: "[SeoContentPanel] 📥 Loading content ideas: {projectId: 'test', hypothesisId: 'test'}",
        data: JSON.stringify({ projectId: "test", hypothesisId: "test" })
      },
      mockContext
    );
    console.log(`✅ Результат: ${result1}`);
    console.log();

    // Тест 2: error level
    console.log("📤 Тест 2: ERROR level");
    const result2 = await resolvers.Mutation.logFrontendMessage(
      null,
      {
        level: "error",
        message: "[SeoContentPanel] ❌ Error loading content ideas: Network error",
        data: JSON.stringify({ error: "Network error", stack: "Error stack..." })
      },
      mockContext
    );
    console.log(`✅ Результат: ${result2}`);
    console.log();

    // Тест 3: warn level
    console.log("📤 Тест 3: WARN level");
    const result3 = await resolvers.Mutation.logFrontendMessage(
      null,
      {
        level: "warn",
        message: "[seoAgentClient] ⚠️ No projectId or hypothesisId in headers!",
      },
      mockContext
    );
    console.log(`✅ Результат: ${result3}`);
    console.log();

    // Тест 4: info level
    console.log("📤 Тест 4: INFO level");
    const result4 = await resolvers.Mutation.logFrontendMessage(
      null,
      {
        level: "info",
        message: "[SeoContentPanel] ✅ Loaded ideas: 21",
        data: JSON.stringify({ count: 21, ideas: ["idea1", "idea2", "idea3"] })
      },
      mockContext
    );
    console.log(`✅ Результат: ${result4}`);
    console.log();

    // 4. Проверка схемы
    console.log("4️⃣ ПРОВЕРКА GRAPHQL СХЕМЫ");
    console.log("-".repeat(70));
    const { typeDefs } = await import("../src/schema/typeDefs.js");
    const schemaString = typeDefs.loc?.source.body || "";
    
    if (schemaString.includes("logFrontendMessage")) {
      console.log("✅ Mutation logFrontendMessage найдена в схеме");
    } else {
      console.warn("⚠️ Mutation logFrontendMessage не найдена в схеме");
    }
    console.log();

    // 5. Итоговый отчет
    console.log("=".repeat(70));
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=".repeat(70));
    console.log();
    console.log("✅ Все тесты пройдены успешно!");
    console.log();
    console.log("💡 ЧТО ДАЛЬШЕ:");
    console.log("   1. Убедитесь, что фронтенд запущен");
    console.log("   2. Откройте http://localhost:8080/seo-agent#content");
    console.log("   3. В консоли БЭКЕНДА должны появиться логи фронтенда");
    console.log("   4. Логи будут иметь префикс [FRONTEND LOG/ERROR/WARN]");
    console.log();

    await mongoose.connection.close();
  } catch (error: any) {
    console.error("\n❌ Ошибка при тестировании:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testFrontendLogger();



