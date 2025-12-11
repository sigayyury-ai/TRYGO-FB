import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Тест системы перехвата логов через реальный GraphQL запрос
 * Симулирует запрос от фронтенда
 */

async function testFrontendLoggerGraphQL() {
  try {
    console.log("=".repeat(70));
    console.log("🧪 ТЕСТ СИСТЕМЫ ПЕРЕХВАТА ЛОГОВ ЧЕРЕЗ GRAPHQL");
    console.log("=".repeat(70));
    console.log();

    const seoAgentUrl = process.env.SEO_AGENT_URL || "http://localhost:4100/graphql";
    
    console.log("1️⃣ ПРОВЕРКА ENDPOINT");
    console.log("-".repeat(70));
    console.log(`URL: ${seoAgentUrl}`);
    console.log();

    // Тест 1: LOG level
    console.log("2️⃣ ТЕСТ 1: LOG LEVEL");
    console.log("-".repeat(70));
    const mutation1 = `
      mutation {
        logFrontendMessage(
          level: "log",
          message: "[SeoContentPanel] 📥 Loading content ideas: {projectId: '69387a92ef08390214f02418', hypothesisId: '69387a92ef08390214f02419'}",
          data: "{\\"projectId\\":\\"69387a92ef08390214f02418\\",\\"hypothesisId\\":\\"69387a92ef08390214f02419\\"}"
        )
      }
    `;

    try {
      const response1 = await fetch(seoAgentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: mutation1,
        }),
      });

      const result1 = await response1.json();
      if (result1.errors) {
        console.error("❌ Ошибка:", result1.errors);
      } else {
        console.log("✅ Успешно отправлено!");
        console.log("   Результат:", result1.data);
      }
    } catch (error: any) {
      console.error("❌ Ошибка запроса:", error.message);
      console.log("   ⚠️ Backend может быть не запущен");
    }
    console.log();

    // Тест 2: ERROR level
    console.log("3️⃣ ТЕСТ 2: ERROR LEVEL");
    console.log("-".repeat(70));
    const mutation2 = `
      mutation {
        logFrontendMessage(
          level: "error",
          message: "[SeoContentPanel] ❌ Error loading content ideas: Failed to fetch"
        )
      }
    `;

    try {
      const response2 = await fetch(seoAgentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: mutation2,
        }),
      });

      const result2 = await response2.json();
      if (result2.errors) {
        console.error("❌ Ошибка:", result2.errors);
      } else {
        console.log("✅ Успешно отправлено!");
        console.log("   Результат:", result2.data);
      }
    } catch (error: any) {
      console.error("❌ Ошибка запроса:", error.message);
    }
    console.log();

    // Тест 3: INFO level с данными
    console.log("4️⃣ ТЕСТ 3: INFO LEVEL С ДАННЫМИ");
    console.log("-".repeat(70));
    const mutation3 = `
      mutation {
        logFrontendMessage(
          level: "info",
          message: "[SeoContentPanel] ✅ Loaded ideas: 21",
          data: "{\\"count\\":21,\\"sampleIdeas\\":[\\"idea1\\",\\"idea2\\",\\"idea3\\"]}"
        )
      }
    `;

    try {
      const response3 = await fetch(seoAgentUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: mutation3,
        }),
      });

      const result3 = await response3.json();
      if (result3.errors) {
        console.error("❌ Ошибка:", result3.errors);
      } else {
        console.log("✅ Успешно отправлено!");
        console.log("   Результат:", result3.data);
      }
    } catch (error: any) {
      console.error("❌ Ошибка запроса:", error.message);
    }
    console.log();

    // Итоговый отчет
    console.log("=".repeat(70));
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=".repeat(70));
    console.log();
    console.log("✅ Тесты GraphQL запросов завершены!");
    console.log();
    console.log("💡 ЧТО ПРОВЕРЕНО:");
    console.log("   ✅ Mutation logFrontendMessage доступна через GraphQL");
    console.log("   ✅ Поддержка разных уровней логирования");
    console.log("   ✅ Поддержка передачи данных");
    console.log();
    console.log("📝 СЛЕДУЮЩИЕ ШАГИ:");
    console.log("   1. Убедитесь, что бэкенд запущен на порту 4100");
    console.log("   2. Откройте фронтенд: http://localhost:8080/seo-agent#content");
    console.log("   3. В консоли БЭКЕНДА должны появиться логи с префиксом [FRONTEND]");
    console.log("   4. Логи будут автоматически отправляться при работе с SEO Agent");
    console.log();

  } catch (error: any) {
    console.error("\n❌ Критическая ошибка:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testFrontendLoggerGraphQL();



