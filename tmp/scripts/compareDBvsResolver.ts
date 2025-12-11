import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

interface ItemAnalysis {
  id: string;
  projectId: string;
  hypothesisId: string;
  title: string;
  status: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  inResolver: boolean;
  reason?: string;
}

async function compareDBvsResolver() {
  try {
    console.log("🔍 Сравнение данных БД и резолвера");
    console.log("=====================================\n");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    // 1. Получаем ВСЕ элементы из БД
    const allItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    })
      .sort({ updatedAt: -1 })
      .limit(10000)
      .exec();

    console.log(`📊 Всего элементов в БД: ${allItems.length}\n`);

    // 2. Симулируем запрос резолвера
    const query: Record<string, unknown> = {
      projectId: testProjectId
    };
    
    if (testHypothesisId && testHypothesisId.trim() !== "") {
      query.hypothesisId = testHypothesisId;
    }

    const resolverItems = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .limit(10000)
      .exec();

    console.log(`📊 Элементов в резолвере: ${resolverItems.length}\n`);

    // 3. Создаем мапу элементов из резолвера
    const resolverIds = new Set(resolverItems.map(item => item._id.toString()));

    // 4. Анализируем каждый элемент
    const analysis: ItemAnalysis[] = allItems.map(item => {
      const inResolver = resolverIds.has(item._id.toString());
      return {
        id: item._id.toString(),
        projectId: item.projectId,
        hypothesisId: item.hypothesisId,
        title: item.title,
        status: item.status,
        category: item.category,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        inResolver,
        reason: inResolver ? "✅ В резолвере" : "❌ НЕ в резолвере"
      };
    });

    // 5. Разделяем на группы
    const inResolver = analysis.filter(item => item.inResolver);
    const notInResolver = analysis.filter(item => !item.inResolver);

    console.log("📊 СТАТИСТИКА:");
    console.log(`   Всего в БД: ${allItems.length}`);
    console.log(`   В резолвере: ${inResolver.length}`);
    console.log(`   НЕ в резолвере: ${notInResolver.length}`);
    console.log();

    // 6. Анализ по статусам
    console.log("📊 АНАЛИЗ ПО СТАТУСАМ (все элементы):");
    const statusCounts = analysis.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    Object.entries(statusCounts).forEach(([status, count]) => {
      const inRes = analysis.filter(i => i.status === status && i.inResolver).length;
      const notInRes = analysis.filter(i => i.status === status && !i.inResolver).length;
      console.log(`   ${status}: ${count} (в резолвере: ${inRes}, не в резолвере: ${notInRes})`);
    });
    console.log();

    // 7. Примеры элементов, которые ВЫВОДЯТСЯ
    console.log("✅ ПРИМЕРЫ ЭЛЕМЕНТОВ, КОТОРЫЕ ВЫВОДЯТСЯ НА ФРОНТЕНДЕ:");
    console.log("=" .repeat(80));
    if (inResolver.length > 0) {
      inResolver.slice(0, 5).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Category: ${item.category}`);
        console.log(`   ProjectId: ${item.projectId}`);
        console.log(`   HypothesisId: ${item.hypothesisId}`);
        console.log(`   Created: ${item.createdAt.toISOString()}`);
        console.log(`   Updated: ${item.updatedAt.toISOString()}`);
      });
    }
    console.log();

    // 8. Примеры элементов, которые НЕ ВЫВОДЯТСЯ
    console.log("❌ ПРИМЕРЫ ЭЛЕМЕНТОВ, КОТОРЫЕ НЕ ВЫВОДЯТСЯ НА ФРОНТЕНДЕ:");
    console.log("=" .repeat(80));
    if (notInResolver.length > 0) {
      notInResolver.slice(0, 10).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Category: ${item.category}`);
        console.log(`   ProjectId: ${item.projectId}`);
        console.log(`   HypothesisId: ${item.hypothesisId}`);
        console.log(`   Created: ${item.createdAt.toISOString()}`);
        console.log(`   Updated: ${item.updatedAt.toISOString()}`);
      });
    } else {
      console.log("   Все элементы в резолвере!");
    }
    console.log();

    // 9. Сравнение структур данных
    console.log("🔍 СРАВНЕНИЕ СТРУКТУР ДАННЫХ:");
    console.log("=" .repeat(80));
    
    if (inResolver.length > 0 && notInResolver.length > 0) {
      const exampleIn = inResolver[0];
      const exampleOut = notInResolver[0];
      
      console.log("\n✅ Элемент, который ВЫВОДИТСЯ:");
      console.log(JSON.stringify({
        id: exampleIn.id,
        projectId: exampleIn.projectId,
        hypothesisId: exampleIn.hypothesisId,
        status: exampleIn.status,
        category: exampleIn.category,
        title: exampleIn.title.substring(0, 50) + "..."
      }, null, 2));
      
      console.log("\n❌ Элемент, который НЕ ВЫВОДИТСЯ:");
      console.log(JSON.stringify({
        id: exampleOut.id,
        projectId: exampleOut.projectId,
        hypothesisId: exampleOut.hypothesisId,
        status: exampleOut.status,
        category: exampleOut.category,
        title: exampleOut.title.substring(0, 50) + "..."
      }, null, 2));
      
      // Поиск различий
      console.log("\n🔍 РАЗЛИЧИЯ:");
      const differences: string[] = [];
      if (exampleIn.projectId !== exampleOut.projectId) {
        differences.push(`projectId: "${exampleIn.projectId}" vs "${exampleOut.projectId}"`);
      }
      if (exampleIn.hypothesisId !== exampleOut.hypothesisId) {
        differences.push(`hypothesisId: "${exampleIn.hypothesisId}" vs "${exampleOut.hypothesisId}"`);
      }
      if (exampleIn.status !== exampleOut.status) {
        differences.push(`status: "${exampleIn.status}" vs "${exampleOut.status}"`);
      }
      if (exampleIn.category !== exampleOut.category) {
        differences.push(`category: "${exampleIn.category}" vs "${exampleOut.category}"`);
      }
      
      if (differences.length > 0) {
        differences.forEach(diff => console.log(`   - ${diff}`));
      } else {
        console.log("   ⚠️  Структурных различий не найдено!");
      }
    }
    console.log();

    // 10. Создаем таблицу для отчета
    console.log("📋 СОЗДАНИЕ ТАБЛИЦЫ ДАННЫХ...");
    
    const tableData = analysis.map(item => ({
      id: item.id,
      title: item.title.substring(0, 60) + (item.title.length > 60 ? "..." : ""),
      status: item.status,
      category: item.category,
      projectId: item.projectId,
      hypothesisId: item.hypothesisId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      inResolver: item.inResolver ? "✅" : "❌"
    }));

    // Сохраняем в JSON
    const jsonPath = path.join(process.cwd(), "..", "logs", `db-vs-resolver-comparison-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(tableData, null, 2), "utf-8");
    console.log(`💾 JSON сохранен: ${jsonPath}`);

    // Создаем CSV
    const csvHeaders = "ID,Title,Status,Category,ProjectId,HypothesisId,CreatedAt,UpdatedAt,InResolver\n";
    const csvRows = tableData.map(item => 
      `"${item.id}","${item.title.replace(/"/g, '""')}","${item.status}","${item.category}","${item.projectId}","${item.hypothesisId}","${item.createdAt}","${item.updatedAt}","${item.inResolver}"`
    ).join("\n");
    const csvPath = path.join(process.cwd(), "..", "logs", `db-vs-resolver-comparison-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, csvHeaders + csvRows, "utf-8");
    console.log(`💾 CSV сохранен: ${csvPath}`);

    // Создаем детальный отчет в Markdown
    const mdPath = path.join(process.cwd(), "..", "logs", `db-vs-resolver-report-${Date.now()}.md`);
    let mdContent = "# Сравнение данных БД и резолвера\n\n";
    mdContent += `**Дата:** ${new Date().toISOString()}\n\n`;
    mdContent += `**Всего в БД:** ${allItems.length}\n`;
    mdContent += `**В резолвере:** ${inResolver.length}\n`;
    mdContent += `**НЕ в резолвере:** ${notInResolver.length}\n\n`;
    
    mdContent += "## Статистика по статусам\n\n";
    mdContent += "| Status | Всего | В резолвере | НЕ в резолвере |\n";
    mdContent += "|--------|-------|-------------|----------------|\n";
    Object.entries(statusCounts).forEach(([status, count]) => {
      const inRes = analysis.filter(i => i.status === status && i.inResolver).length;
      const notInRes = analysis.filter(i => i.status === status && !i.inResolver).length;
      mdContent += `| ${status} | ${count} | ${inRes} | ${notInRes} |\n`;
    });
    mdContent += "\n";

    mdContent += "## Примеры элементов, которые ВЫВОДЯТСЯ\n\n";
    inResolver.slice(0, 10).forEach((item, i) => {
      mdContent += `### ${i + 1}. ${item.title}\n\n`;
      mdContent += `- **ID:** \`${item.id}\`\n`;
      mdContent += `- **Status:** \`${item.status}\`\n`;
      mdContent += `- **Category:** \`${item.category}\`\n`;
      mdContent += `- **ProjectId:** \`${item.projectId}\`\n`;
      mdContent += `- **HypothesisId:** \`${item.hypothesisId}\`\n`;
      mdContent += `- **Created:** ${item.createdAt.toISOString()}\n`;
      mdContent += `- **Updated:** ${item.updatedAt.toISOString()}\n\n`;
    });

    mdContent += "## Примеры элементов, которые НЕ ВЫВОДЯТСЯ\n\n";
    if (notInResolver.length > 0) {
      notInResolver.slice(0, 10).forEach((item, i) => {
        mdContent += `### ${i + 1}. ${item.title}\n\n`;
        mdContent += `- **ID:** \`${item.id}\`\n`;
        mdContent += `- **Status:** \`${item.status}\`\n`;
        mdContent += `- **Category:** \`${item.category}\`\n`;
        mdContent += `- **ProjectId:** \`${item.projectId}\`\n`;
        mdContent += `- **HypothesisId:** \`${item.hypothesisId}\`\n`;
        mdContent += `- **Created:** ${item.createdAt.toISOString()}\n`;
        mdContent += `- **Updated:** ${item.updatedAt.toISOString()}\n\n`;
      });
    } else {
      mdContent += "Все элементы в резолвере!\n\n";
    }

    mdContent += "## Полная таблица данных\n\n";
    mdContent += "| ID | Title | Status | Category | ProjectId | HypothesisId | InResolver |\n";
    mdContent += "|----|-------|--------|----------|----------|--------------|-----------|\n";
    tableData.forEach(item => {
      mdContent += `| \`${item.id.substring(0, 8)}...\` | ${item.title.substring(0, 40)}... | ${item.status} | ${item.category} | \`${item.projectId.substring(0, 8)}...\` | \`${item.hypothesisId.substring(0, 8)}...\` | ${item.inResolver} |\n`;
    });

    fs.writeFileSync(mdPath, mdContent, "utf-8");
    console.log(`💾 Markdown отчет сохранен: ${mdPath}`);

    await mongoose.disconnect();
    console.log("\n✅ Анализ завершен");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

compareDBvsResolver();

