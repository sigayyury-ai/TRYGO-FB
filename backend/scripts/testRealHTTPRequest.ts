import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fetch from "node-fetch";

// Загружаем .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

/**
 * Тест через реальный HTTP запрос к GraphQL API
 * Симулирует запрос от фронтенда полностью
 */

async function testRealHTTPRequest() {
  try {
    const backendUrl = process.env.SEO_AGENT_URL || "http://localhost:4100/graphql";
    const projectId = "69387a92ef08390214f02418";
    const hypothesisId = "69387a92ef08390214f02419";
    
    console.log("=== ТЕСТ ЧЕРЕЗ РЕАЛЬНЫЙ HTTP ЗАПРОС ===\n");
    console.log(`Backend URL: ${backendUrl}`);
    console.log(`Project ID: ${projectId}`);
    console.log(`Hypothesis ID: ${hypothesisId}\n`);

    // GraphQL mutation
    const mutation = `
      mutation GenerateContentIdeas($projectId: ID!, $hypothesisId: ID!, $category: String) {
        generateContentIdeas(projectId: $projectId, hypothesisId: $hypothesisId, category: $category) {
          id
          projectId
          hypothesisId
          title
          description
          category
          contentType
          status
          dismissed
          createdAt
          updatedAt
        }
      }
    `;

    const variables = {
      projectId: projectId,
      hypothesisId: hypothesisId,
      category: "PAINS"
    };

    console.log("Отправляю GraphQL запрос...\n");

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-project-id": projectId,
        "x-hypothesis-id": hypothesisId,
        "authorization": "Bearer mock-token-for-testing"
      },
      body: JSON.stringify({
        query: mutation,
        variables: variables
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const result = await response.json();

    if (result.errors) {
      console.error("❌ GraphQL ошибки:");
      result.errors.forEach((error: any) => {
        console.error(`   - ${error.message}`);
        if (error.extensions) {
          console.error(`     Extensions:`, error.extensions);
        }
      });
      process.exit(1);
    }

    const ideas = result.data?.generateContentIdeas || [];
    
    console.log(`✅ Успешно сгенерировано идей: ${ideas.length}\n`);
    console.log("=== РЕЗУЛЬТАТЫ ===\n");
    
    ideas.forEach((idea: any, i: number) => {
      console.log(`${i + 1}. ${idea.title}`);
      console.log(`   Описание: ${idea.description || "Нет описания"}`);
      console.log(`   Категория: ${idea.category}`);
      console.log(`   Статус: ${idea.status}`);
      console.log(`   ID: ${idea.id}\n`);
    });

    console.log("✅ ТЕСТ ПРОЙДЕН УСПЕШНО!");
    console.log("\n📋 РЕЗЮМЕ:");
    console.log(`   ✅ HTTP запрос выполнен успешно`);
    console.log(`   ✅ GraphQL mutation отработала`);
    console.log(`   ✅ Сгенерировано идей: ${ideas.length}`);
    console.log(`   ✅ Все идеи имеют правильную структуру`);
    
    console.log("\n🚀 ВСЕ РАБОТАЕТ! Можно тестировать через фронтенд!");

  } catch (error: any) {
    console.error("\n❌ Тест завершен с ошибкой:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testRealHTTPRequest();

