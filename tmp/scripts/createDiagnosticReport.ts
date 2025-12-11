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

interface DiagnosticReport {
  timestamp: string;
  summary: {
    totalInDB: number;
    foundByQuery: number;
    discrepancy: number;
  };
  query: any;
  analysis: {
    possibleCauses: string[];
    recommendations: string[];
  };
  rawData: {
    allProjectItems: number;
    allHypothesisItems: number;
    itemsWithStatus: Record<string, number>;
  };
}

async function createDiagnosticReport() {
  try {
    console.log("🔍 Создание диагностического отчета");
    console.log("=====================================\n");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalInDB: 0,
        foundByQuery: 0,
        discrepancy: 0
      },
      query: {
        projectId: testProjectId,
        hypothesisId: testHypothesisId
      },
      analysis: {
        possibleCauses: [],
        recommendations: []
      },
      rawData: {
        allProjectItems: 0,
        allHypothesisItems: 0,
        itemsWithStatus: {}
      }
    };

    // Тест 1: Все элементы проекта
    const allProjectItems = await SeoBacklogIdea.find({ projectId: testProjectId }).exec();
    report.rawData.allProjectItems = allProjectItems.length;
    console.log(`📊 Все элементы проекта: ${allProjectItems.length}`);

    // Тест 2: Все элементы гипотезы
    const allHypothesisItems = await SeoBacklogIdea.find({ 
      projectId: testProjectId,
      hypothesisId: testHypothesisId 
    }).exec();
    report.rawData.allHypothesisItems = allHypothesisItems.length;
    console.log(`📊 Все элементы гипотезы: ${allHypothesisItems.length}`);

    // Тест 3: Точный запрос из резолвера
    const query: Record<string, unknown> = {
      projectId: testProjectId
    };
    
    if (testHypothesisId && testHypothesisId.trim() !== "") {
      query.hypothesisId = testHypothesisId;
    }

    const countBefore = await SeoBacklogIdea.countDocuments(query);
    console.log(`📊 countDocuments(): ${countBefore}`);

    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .limit(10000)
      .exec();

    report.summary.totalInDB = countBefore;
    report.summary.foundByQuery = docs.length;
    report.summary.discrepancy = countBefore - docs.length;

    console.log(`📊 find() результат: ${docs.length}`);
    console.log(`📊 Расхождение: ${report.summary.discrepancy}\n`);

    // Анализ статусов
    const statusCounts = docs.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    report.rawData.itemsWithStatus = statusCounts;

    console.log("📊 Распределение по статусам:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log();

    // Проверка на возможные причины
    if (docs.length < countBefore) {
      report.analysis.possibleCauses.push(
        "Mongoose применяет дефолтный лимит (возможно 50)"
      );
      report.analysis.possibleCauses.push(
        "Проблема с индексами MongoDB"
      );
      report.analysis.possibleCauses.push(
        "Проблема с типами данных в запросе (строки vs ObjectId)"
      );
      report.analysis.possibleCauses.push(
        "Проблема с кэшированием запросов"
      );
    }

    // Рекомендации
    if (docs.length < countBefore) {
      report.analysis.recommendations.push(
        "Попробовать использовать нативный MongoDB драйвер вместо Mongoose"
      );
      report.analysis.recommendations.push(
        "Проверить настройки Mongoose по умолчанию"
      );
      report.analysis.recommendations.push(
        "Использовать cursor/pagination вместо find()"
      );
      report.analysis.recommendations.push(
        "Проверить, нет ли middleware, который обрезает результаты"
      );
    }

    // Тест 4: Нативный MongoDB драйвер
    console.log("📊 Тест через нативный MongoDB драйвер:");
    const collection = mongoose.connection.db.collection("seobacklogideas");
    const nativeCount = await collection.countDocuments(query);
    const nativeDocs = await collection.find(query)
      .sort({ updatedAt: -1 })
      .limit(10000)
      .toArray();
    
    console.log(`   countDocuments(): ${nativeCount}`);
    console.log(`   find().toArray(): ${nativeDocs.length}`);
    console.log();

    // Сохранение отчета
    const reportPath = path.join(process.cwd(), "..", "logs", `diagnostic-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`💾 Отчет сохранен: ${reportPath}`);

    // Вывод итогов
    console.log("\n📋 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=====================================");
    console.log(`Всего в БД: ${report.summary.totalInDB}`);
    console.log(`Найдено запросом: ${report.summary.foundByQuery}`);
    console.log(`Расхождение: ${report.summary.discrepancy}`);
    
    if (report.summary.discrepancy > 0) {
      console.log("\n⚠️  ОБНАРУЖЕНО РАСХОЖДЕНИЕ!");
      console.log("\nВозможные причины:");
      report.analysis.possibleCauses.forEach((cause, i) => {
        console.log(`   ${i + 1}. ${cause}`);
      });
      console.log("\nРекомендации:");
      report.analysis.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    } else {
      console.log("\n✅ Расхождений не обнаружено");
    }

    await mongoose.disconnect();
    console.log("\n✅ Диагностика завершена");
  } catch (error: any) {
    console.error("❌ Ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createDiagnosticReport();

