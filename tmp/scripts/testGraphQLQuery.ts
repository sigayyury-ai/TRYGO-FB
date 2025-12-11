import "dotenv/config";
import fetch from "node-fetch";

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";
const graphqlUrl = "http://localhost:4100/graphql";

const query = `
  query GetSeoAgentBacklog($projectId: ID!, $hypothesisId: ID) {
    seoAgentBacklog(projectId: $projectId, hypothesisId: $hypothesisId) {
      id
      projectId
      hypothesisId
      title
      description
      contentType
      clusterId
      status
      createdAt
      updatedAt
    }
  }
`;

async function testGraphQLQuery() {
  try {
    console.log("🔍 Тестирование GraphQL запроса");
    console.log("=====================================\n");
    console.log(`URL: ${graphqlUrl}`);
    console.log(`ProjectId: ${testProjectId}`);
    console.log(`HypothesisId: ${testHypothesisId}\n`);

    const variables = {
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    };

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables
      })
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error("Response:", text);
      return;
    }

    const result = await response.json();

    if (result.errors) {
      console.error("❌ GraphQL Errors:");
      result.errors.forEach((error: any) => {
        console.error(`   - ${error.message}`);
        if (error.extensions) {
          console.error(`     Extensions:`, error.extensions);
        }
      });
    }

    if (result.data) {
      const items = result.data.seoAgentBacklog || [];
      console.log(`✅ Успешно получено элементов: ${items.length}`);
      
      // Анализ статусов
      const statusCounts = items.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});

      console.log("\n📊 Распределение по статусам:");
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });

      console.log(`\n✅ Элементов со статусом PENDING: ${statusCounts.PENDING || 0}`);

      // Проверка размера ответа
      const responseSize = JSON.stringify(result).length;
      console.log(`\n📦 Размер ответа: ${(responseSize / 1024).toFixed(2)} KB`);

      // Проверка на обрезание
      if (items.length < 100) {
        console.log("\n⚠️  ВНИМАНИЕ: Получено меньше 100 элементов!");
        console.log("   Это может указывать на обрезание ответа.");
      }

      // Показываем первые 3 элемента
      if (items.length > 0) {
        console.log("\n📋 Примеры элементов (первые 3):");
        items.slice(0, 3).forEach((item: any, i: number) => {
          console.log(`   ${i + 1}. ${item.title.substring(0, 50)}... [${item.status}]`);
        });
      }
    } else {
      console.error("❌ Нет данных в ответе");
      console.error("Полный ответ:", JSON.stringify(result, null, 2));
    }

  } catch (error: any) {
    console.error("❌ Ошибка:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("   Бекенд не запущен на порту 4100");
    }
  }
}

testGraphQLQuery();

