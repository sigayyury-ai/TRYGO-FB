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

// Функция маппинга статусов из резолвера
const toUpperEnum = (value: string) => value.toUpperCase();
const mapBacklogStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    backlog: "PENDING",
    scheduled: "SCHEDULED",
    archived: "ARCHIVED"
  };
  return statusMap[status.toLowerCase()] || toUpperEnum(status);
};

async function createFullDataReport() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const query: Record<string, unknown> = {
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    };

    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .limit(10000)
      .exec();

    console.log(`📊 Всего элементов: ${docs.length}\n`);

    // Маппинг статусов
    const mappedItems = docs.map(doc => ({
      id: doc._id.toString(),
      projectId: doc.projectId,
      hypothesisId: doc.hypothesisId,
      title: doc.title,
      description: doc.description,
      category: doc.category,
      originalStatus: doc.status,
      mappedStatus: mapBacklogStatus(doc.status),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      willShowOnFrontend: mapBacklogStatus(doc.status) === "PENDING"
    }));

    // Разделение на группы
    const willShow = mappedItems.filter(item => item.willShowOnFrontend);
    const willNotShow = mappedItems.filter(item => !item.willShowOnFrontend);

    console.log("📊 СТАТИСТИКА:");
    console.log(`   Всего в БД: ${docs.length}`);
    console.log(`   Будет показано на фронтенде (PENDING): ${willShow.length}`);
    console.log(`   НЕ будет показано (другие статусы): ${willNotShow.length}`);
    console.log();

    // Создаем детальную таблицу
    const tableData = mappedItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description?.substring(0, 100) || "",
      category: item.category,
      originalStatus: item.originalStatus,
      mappedStatus: item.mappedStatus,
      projectId: item.projectId,
      hypothesisId: item.hypothesisId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      willShowOnFrontend: item.willShowOnFrontend ? "✅ ДА" : "❌ НЕТ"
    }));

    // Сохраняем JSON
    const jsonPath = path.join(process.cwd(), "..", "logs", `full-data-report-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(tableData, null, 2), "utf-8");
    console.log(`💾 JSON сохранен: ${jsonPath}`);

    // Создаем CSV
    const csvHeaders = "ID,Title,Description,Category,OriginalStatus,MappedStatus,ProjectId,HypothesisId,CreatedAt,UpdatedAt,WillShowOnFrontend\n";
    const csvRows = tableData.map(item => 
      `"${item.id}","${item.title.replace(/"/g, '""')}","${(item.description || "").replace(/"/g, '""')}","${item.category}","${item.originalStatus}","${item.mappedStatus}","${item.projectId}","${item.hypothesisId}","${item.createdAt}","${item.updatedAt}","${item.willShowOnFrontend}"`
    ).join("\n");
    const csvPath = path.join(process.cwd(), "..", "logs", `full-data-report-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, csvHeaders + csvRows, "utf-8");
    console.log(`💾 CSV сохранен: ${csvPath}`);

    // Создаем Markdown отчет
    const mdPath = path.join(process.cwd(), "..", "logs", `full-data-report-${Date.now()}.md`);
    let mdContent = "# Полный отчет о данных в базе данных\n\n";
    mdContent += `**Дата:** ${new Date().toISOString()}\n\n`;
    mdContent += `**Всего элементов:** ${docs.length}\n`;
    mdContent += `**Будет показано на фронтенде (PENDING):** ${willShow.length}\n`;
    mdContent += `**НЕ будет показано (другие статусы):** ${willNotShow.length}\n\n`;

    mdContent += "## Статистика по статусам\n\n";
    mdContent += "| Оригинальный статус | Количество | Маппированный статус | Показывается на фронте |\n";
    mdContent += "|---------------------|------------|------------------------|------------------------|\n";
    
    const statusGroups = mappedItems.reduce((acc, item) => {
      const key = item.originalStatus;
      if (!acc[key]) {
        acc[key] = {
          original: item.originalStatus,
          mapped: item.mappedStatus,
          count: 0,
          willShow: 0
        };
      }
      acc[key].count++;
      if (item.willShowOnFrontend) acc[key].willShow++;
      return acc;
    }, {} as Record<string, any>);

    Object.values(statusGroups).forEach((group: any) => {
      mdContent += `| ${group.original} | ${group.count} | ${group.mapped} | ${group.willShow > 0 ? "✅ ДА" : "❌ НЕТ"} |\n`;
    });
    mdContent += "\n";

    mdContent += "## Примеры элементов, которые ВЫВОДЯТСЯ на фронтенде\n\n";
    willShow.slice(0, 10).forEach((item, i) => {
      mdContent += `### ${i + 1}. ${item.title}\n\n`;
      mdContent += `- **ID:** \`${item.id}\`\n`;
      mdContent += `- **Описание:** ${item.description?.substring(0, 200) || "Нет описания"}\n`;
      mdContent += `- **Категория:** \`${item.category}\`\n`;
      mdContent += `- **Оригинальный статус:** \`${item.originalStatus}\`\n`;
      mdContent += `- **Маппированный статус:** \`${item.mappedStatus}\`\n`;
      mdContent += `- **ProjectId:** \`${item.projectId}\`\n`;
      mdContent += `- **HypothesisId:** \`${item.hypothesisId}\`\n`;
      mdContent += `- **Создан:** ${item.createdAt}\n`;
      mdContent += `- **Обновлен:** ${item.updatedAt}\n\n`;
    });

    mdContent += "## Примеры элементов, которые НЕ ВЫВОДЯТСЯ на фронтенде\n\n";
    if (willNotShow.length > 0) {
      willNotShow.slice(0, 10).forEach((item, i) => {
        mdContent += `### ${i + 1}. ${item.title}\n\n`;
        mdContent += `- **ID:** \`${item.id}\`\n`;
        mdContent += `- **Описание:** ${item.description?.substring(0, 200) || "Нет описания"}\n`;
        mdContent += `- **Категория:** \`${item.category}\`\n`;
        mdContent += `- **Оригинальный статус:** \`${item.originalStatus}\`\n`;
        mdContent += `- **Маппированный статус:** \`${item.mappedStatus}\`\n`;
        mdContent += `- **ProjectId:** \`${item.projectId}\`\n`;
        mdContent += `- **HypothesisId:** \`${item.hypothesisId}\`\n`;
        mdContent += `- **Создан:** ${item.createdAt}\n`;
        mdContent += `- **Обновлен:** ${item.updatedAt}\n`;
        mdContent += `- **Причина скрытия:** Статус \`${item.mappedStatus}\` не равен \`PENDING\`\n\n`;
      });
    } else {
      mdContent += "Все элементы будут показаны на фронтенде!\n\n";
    }

    mdContent += "## Полная таблица данных\n\n";
    mdContent += "| ID | Title | Category | Original Status | Mapped Status | Will Show |\n";
    mdContent += "|----|-------|----------|-----------------|---------------|-----------|\n";
    tableData.forEach(item => {
      const shortId = item.id.substring(0, 12) + "...";
      const shortTitle = item.title.length > 40 ? item.title.substring(0, 40) + "..." : item.title;
      mdContent += `| \`${shortId}\` | ${shortTitle} | ${item.category} | ${item.originalStatus} | ${item.mappedStatus} | ${item.willShowOnFrontend} |\n`;
    });

    fs.writeFileSync(mdPath, mdContent, "utf-8");
    console.log(`💾 Markdown отчет сохранен: ${mdPath}`);

    // Выводим примеры в консоль
    console.log("\n✅ ПРИМЕРЫ ЭЛЕМЕНТОВ, КОТОРЫЕ ВЫВОДЯТСЯ НА ФРОНТЕНДЕ:");
    console.log("=" .repeat(80));
    willShow.slice(0, 5).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.title}`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Оригинальный статус: ${item.originalStatus}`);
      console.log(`   Маппированный статус: ${item.mappedStatus}`);
      console.log(`   Категория: ${item.category}`);
    });

    console.log("\n❌ ПРИМЕРЫ ЭЛЕМЕНТОВ, КОТОРЫЕ НЕ ВЫВОДЯТСЯ НА ФРОНТЕНДЕ:");
    console.log("=" .repeat(80));
    if (willNotShow.length > 0) {
      willNotShow.slice(0, 5).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   Оригинальный статус: ${item.originalStatus}`);
        console.log(`   Маппированный статус: ${item.mappedStatus}`);
        console.log(`   Категория: ${item.category}`);
        console.log(`   Причина: Статус ${item.mappedStatus} не равен PENDING`);
      });
    } else {
      console.log("   Все элементы будут показаны!");
    }

    await mongoose.disconnect();
    console.log("\n✅ Отчет создан");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createFullDataReport();

