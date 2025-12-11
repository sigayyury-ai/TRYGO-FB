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

async function showRawDBRecords() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const query: Record<string, unknown> = {
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    };

    // Получаем ВСЕ записи без преобразований
    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean() // Используем lean() для получения чистых объектов без методов Mongoose
      .exec();

    console.log(`📊 Всего записей: ${docs.length}\n`);

    // Преобразуем в чистые JSON объекты
    const rawRecords = docs.map(doc => {
      // Преобразуем _id в строку для JSON
      const record: any = {
        _id: doc._id.toString(),
        ...doc
      };
      // Удаляем дубликат _id если есть
      if (record.__v !== undefined) {
        delete record.__v;
      }
      return record;
    });

    // Сохраняем в JSON файл
    const jsonPath = path.join(process.cwd(), "..", "logs", `raw-db-records-${Date.now()}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(rawRecords, null, 2), "utf-8");
    console.log(`💾 Сырые записи сохранены в JSON: ${jsonPath}\n`);

    // Выводим первые 5 записей в консоль для примера
    console.log("📋 ПРИМЕРЫ СЫРЫХ ЗАПИСЕЙ (первые 5):");
    console.log("=" .repeat(80));
    rawRecords.slice(0, 5).forEach((record, i) => {
      console.log(`\n${i + 1}. Запись ID: ${record._id}`);
      console.log(JSON.stringify(record, null, 2));
      console.log("-".repeat(80));
    });

    // Создаем также текстовый файл с полным списком
    const txtPath = path.join(process.cwd(), "..", "logs", `raw-db-records-${Date.now()}.txt`);
    let txtContent = `СЫРЫЕ ЗАПИСИ ИЗ БАЗЫ ДАННЫХ\n`;
    txtContent += `Дата: ${new Date().toISOString()}\n`;
    txtContent += `Всего записей: ${rawRecords.length}\n`;
    txtContent += `ProjectId: ${testProjectId}\n`;
    txtContent += `HypothesisId: ${testHypothesisId}\n\n`;
    txtContent += "=" .repeat(80) + "\n\n";

    rawRecords.forEach((record, i) => {
      txtContent += `ЗАПИСЬ ${i + 1} из ${rawRecords.length}\n`;
      txtContent += "-".repeat(80) + "\n";
      txtContent += JSON.stringify(record, null, 2) + "\n\n";
    });

    fs.writeFileSync(txtPath, txtContent, "utf-8");
    console.log(`💾 Полный список сохранен в TXT: ${txtPath}\n`);

    // Создаем также CSV с основными полями
    const csvHeaders = "_id,projectId,hypothesisId,title,description,category,status,createdAt,updatedAt,createdBy,updatedBy,clusterId,scheduledDate\n";
    const csvRows = rawRecords.map(record => {
      const escape = (val: any) => {
        if (val === null || val === undefined) return "";
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      };
      return [
        escape(record._id),
        escape(record.projectId),
        escape(record.hypothesisId),
        escape(record.title),
        escape(record.description),
        escape(record.category),
        escape(record.status),
        escape(record.createdAt),
        escape(record.updatedAt),
        escape(record.createdBy),
        escape(record.updatedBy),
        escape(record.clusterId),
        escape(record.scheduledDate)
      ].join(",");
    }).join("\n");

    const csvPath = path.join(process.cwd(), "..", "logs", `raw-db-records-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, csvHeaders + csvRows, "utf-8");
    console.log(`💾 CSV файл сохранен: ${csvPath}\n`);

    // Статистика по полям
    console.log("📊 СТАТИСТИКА ПО ПОЛЯМ:");
    console.log("=" .repeat(80));
    
    const statusCounts = rawRecords.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\nСтатусы:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    const categoryCounts = rawRecords.reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\nКатегории:");
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });

    // Проверка уникальности projectId и hypothesisId
    const uniqueProjectIds = new Set(rawRecords.map(r => r.projectId));
    const uniqueHypothesisIds = new Set(rawRecords.map(r => r.hypothesisId));
    
    console.log(`\nУникальных projectId: ${uniqueProjectIds.size}`);
    console.log(`Уникальных hypothesisId: ${uniqueHypothesisIds.size}`);
    
    if (uniqueProjectIds.size > 1) {
      console.log(`⚠️  ВНИМАНИЕ: Найдено ${uniqueProjectIds.size} разных projectId!`);
      console.log(`   Значения:`, Array.from(uniqueProjectIds));
    }
    
    if (uniqueHypothesisIds.size > 1) {
      console.log(`⚠️  ВНИМАНИЕ: Найдено ${uniqueHypothesisIds.size} разных hypothesisId!`);
      console.log(`   Значения:`, Array.from(uniqueHypothesisIds));
    }

    await mongoose.disconnect();
    console.log("\n✅ Готово! Все файлы сохранены в папке logs/");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

showRawDBRecords();

