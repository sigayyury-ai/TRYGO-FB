import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testUserId = "686773b5773b5947fed60a68";
const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

interface DiagnosticReport {
  timestamp: string;
  userId: string;
  projectId: string;
  hypothesisId: string;
  steps: {
    [key: string]: {
      status: "ok" | "error" | "warning";
      message: string;
      data?: any;
      details?: any;
    };
  };
}

async function deepDiagnostics() {
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    userId: testUserId,
    projectId: testProjectId,
    hypothesisId: testHypothesisId,
    steps: {}
  };

  try {
    console.log("🔍 ГЛУБОКИЙ ДИАГНОСТИЧЕСКИЙ АНАЛИЗ");
    console.log("=====================================\n");

    // ШАГ 1: Подключение к MongoDB
    console.log("📋 ШАГ 1: Подключение к MongoDB");
    console.log("-----------------------------------");
    try {
      await mongoose.connect(MONGODB_URI);
      report.steps.mongodb_connection = {
        status: "ok",
        message: "Успешное подключение к MongoDB",
        data: {
          uri: MONGODB_URI.replace(/\/\/.*@/, "//***:***@"), // Скрыть credentials
          database: mongoose.connection.db.databaseName
        }
      };
      console.log("✅ Подключено к MongoDB");
      console.log(`   База данных: ${mongoose.connection.db.databaseName}\n`);
    } catch (error: any) {
      report.steps.mongodb_connection = {
        status: "error",
        message: `Ошибка подключения: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка подключения:", error.message);
      throw error;
    }

    // ШАГ 2: Проверка пользователя и проектов
    console.log("📋 ШАГ 2: Проверка пользователя и проектов");
    console.log("-----------------------------------");
    try {
      const projectsCollection = mongoose.connection.db.collection("projects");
      const userProjects = await projectsCollection.find({
        userId: testUserId
      }).toArray();

      const targetProject = await projectsCollection.findOne({
        _id: testProjectId
      });

      report.steps.user_projects = {
        status: "ok",
        message: `Найдено ${userProjects.length} проектов для пользователя`,
        data: {
          totalProjects: userProjects.length,
          projectIds: userProjects.map(p => p._id),
          targetProjectExists: !!targetProject,
          targetProjectData: targetProject ? {
            id: targetProject._id,
            title: targetProject.title || targetProject.name,
            userId: targetProject.userId,
            matchesUser: targetProject.userId === testUserId
          } : null
        }
      };

      console.log(`✅ Найдено проектов для пользователя: ${userProjects.length}`);
      console.log(`   Целевой проект существует: ${targetProject ? "✅" : "❌"}`);
      if (targetProject) {
        console.log(`   Название: ${targetProject.title || targetProject.name}`);
        console.log(`   userId проекта: ${targetProject.userId}`);
        console.log(`   Совпадает с тестовым userId: ${targetProject.userId === testUserId ? "✅" : "❌"}`);
      }
      console.log();
    } catch (error: any) {
      report.steps.user_projects = {
        status: "error",
        message: `Ошибка при проверке проектов: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 3: Проверка гипотез
    console.log("📋 ШАГ 3: Проверка гипотез");
    console.log("-----------------------------------");
    try {
      const hypothesesCollection = mongoose.connection.db.collection("hypotheses");
      const projectHypotheses = await hypothesesCollection.find({
        projectId: testProjectId
      }).toArray();

      const targetHypothesis = await hypothesesCollection.findOne({
        _id: testHypothesisId
      });

      report.steps.hypotheses = {
        status: "ok",
        message: `Найдено ${projectHypotheses.length} гипотез для проекта`,
        data: {
          totalHypotheses: projectHypotheses.length,
          hypothesisIds: projectHypotheses.map(h => h._id),
          targetHypothesisExists: !!targetHypothesis,
          targetHypothesisData: targetHypothesis ? {
            id: targetHypothesis._id,
            projectId: targetHypothesis.projectId,
            matchesProject: targetHypothesis.projectId === testProjectId
          } : null
        }
      };

      console.log(`✅ Найдено гипотез для проекта: ${projectHypotheses.length}`);
      console.log(`   Целевая гипотеза существует: ${targetHypothesis ? "✅" : "❌"}`);
      if (targetHypothesis) {
        console.log(`   projectId гипотезы: ${targetHypothesis.projectId}`);
        console.log(`   Совпадает с тестовым projectId: ${targetHypothesis.projectId === testProjectId ? "✅" : "❌"}`);
      }
      console.log();
    } catch (error: any) {
      report.steps.hypotheses = {
        status: "error",
        message: `Ошибка при проверке гипотез: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 4: Проверка SeoBacklogIdea - точный запрос как в резолвере
    console.log("📋 ШАГ 4: Проверка SeoBacklogIdea (точный запрос из резолвера)");
    console.log("-----------------------------------");
    try {
      // Точный запрос из резолвера
      const query: Record<string, unknown> = {
        projectId: testProjectId
      };
      
      if (testHypothesisId && testHypothesisId.trim() !== "") {
        query.hypothesisId = testHypothesisId;
      }

      console.log("   Запрос:", JSON.stringify(query, null, 2));

      // Тест 1: countDocuments
      const count = await SeoBacklogIdea.countDocuments(query);
      console.log(`   countDocuments(): ${count}`);

      // Тест 2: find без лимита
      const docsNoLimit = await SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      console.log(`   find() без limit: ${docsNoLimit.length}`);

      // Тест 3: find с limit(0)
      const docsLimit0 = await SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .limit(0)
        .exec();
      console.log(`   find() с limit(0): ${docsLimit0.length}`);

      // Тест 4: find с limit(10000)
      const docsLimit10000 = await SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .limit(10000)
        .exec();
      console.log(`   find() с limit(10000): ${docsLimit10000.length}`);

      // Тест 5: find с batchSize
      const docsBatchSize = await SeoBacklogIdea.find(query)
        .sort({ updatedAt: -1 })
        .batchSize(1000)
        .exec();
      console.log(`   find() с batchSize(1000): ${docsBatchSize.length}`);

      // Проверка статусов
      const statusCounts = docsLimit10000.reduce((acc, doc) => {
        acc[doc.status] = (acc[doc.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Проверка на дубликаты
      const ids = docsLimit10000.map(d => d._id.toString());
      const uniqueIds = new Set(ids);
      const duplicates = ids.length - uniqueIds.size;

      report.steps.backlog_query = {
        status: count === docsLimit10000.length ? "ok" : "warning",
        message: `Найдено ${count} элементов, получено ${docsLimit10000.length}`,
        data: {
          query,
          countDocuments: count,
          findNoLimit: docsNoLimit.length,
          findLimit0: docsLimit0.length,
          findLimit10000: docsLimit10000.length,
          findBatchSize: docsBatchSize.length,
          statusCounts,
          duplicates,
          allUnique: duplicates === 0,
          sampleIds: docsLimit10000.slice(0, 5).map(d => ({
            id: d._id.toString(),
            title: d.title.substring(0, 50),
            status: d.status,
            projectId: d.projectId,
            hypothesisId: d.hypothesisId
          }))
        }
      };

      if (count !== docsLimit10000.length) {
        console.log(`   ⚠️  РАСХОЖДЕНИЕ: countDocuments=${count}, но find() вернул=${docsLimit10000.length}`);
      } else {
        console.log(`   ✅ Все запросы вернули одинаковое количество: ${count}`);
      }
      console.log(`   Статусы:`, statusCounts);
      console.log(`   Дубликаты: ${duplicates}`);
      console.log();
    } catch (error: any) {
      report.steps.backlog_query = {
        status: "error",
        message: `Ошибка при запросе backlog: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 5: Проверка маппинга статусов
    console.log("📋 ШАГ 5: Проверка маппинга статусов");
    console.log("-----------------------------------");
    try {
      const docs = await SeoBacklogIdea.find({
        projectId: testProjectId,
        hypothesisId: testHypothesisId
      })
        .sort({ updatedAt: -1 })
        .limit(10000)
        .exec();

      // Симуляция маппинга из резолвера
      const toUpperEnum = (value: string) => value.toUpperCase();
      const mapBacklogStatus = (status: string): string => {
        const statusMap: Record<string, string> = {
          backlog: "PENDING",
          scheduled: "SCHEDULED",
          archived: "ARCHIVED"
        };
        return statusMap[status.toLowerCase()] || toUpperEnum(status);
      };

      const mappedStatuses = docs.map(d => ({
        original: d.status,
        mapped: mapBacklogStatus(d.status)
      }));

      const mappedStatusCounts = mappedStatuses.reduce((acc, item) => {
        acc[item.mapped] = (acc[item.mapped] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const pendingCount = mappedStatuses.filter(s => s.mapped === "PENDING").length;

      report.steps.status_mapping = {
        status: "ok",
        message: `Маппинг выполнен: ${pendingCount} элементов будут PENDING`,
        data: {
          totalItems: docs.length,
          originalStatusCounts: docs.reduce((acc, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          mappedStatusCounts,
          pendingCount,
          mappingExamples: mappedStatuses.slice(0, 10).map(s => ({
            original: s.original,
            mapped: s.mapped
          }))
        }
      };

      console.log(`✅ Всего элементов: ${docs.length}`);
      console.log(`   После маппинга в PENDING: ${pendingCount}`);
      console.log(`   Распределение по маппированным статусам:`, mappedStatusCounts);
      console.log();
    } catch (error: any) {
      report.steps.status_mapping = {
        status: "error",
        message: `Ошибка при маппинге: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 6: Проверка SeoContentItem
    console.log("📋 ШАГ 6: Проверка SeoContentItem");
    console.log("-----------------------------------");
    try {
      const contentItems = await SeoContentItem.find({
        projectId: testProjectId,
        hypothesisId: testHypothesisId
      }).exec();

      const withBacklogId = contentItems.filter(item => item.backlogIdeaId);
      const withoutBacklogId = contentItems.filter(item => !item.backlogIdeaId);

      report.steps.content_items = {
        status: "ok",
        message: `Найдено ${contentItems.length} content items`,
        data: {
          total: contentItems.length,
          withBacklogIdeaId: withBacklogId.length,
          withoutBacklogIdeaId: withoutBacklogId.length,
          statusCounts: contentItems.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };

      console.log(`✅ Content items: ${contentItems.length}`);
      console.log(`   С backlogIdeaId: ${withBacklogId.length}`);
      console.log(`   Без backlogIdeaId: ${withoutBacklogId.length}`);
      console.log();
    } catch (error: any) {
      report.steps.content_items = {
        status: "error",
        message: `Ошибка при проверке content items: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 7: Проверка связи backlog <-> content
    console.log("📋 ШАГ 7: Проверка связи backlog <-> content");
    console.log("-----------------------------------");
    try {
      const backlogItems = await SeoBacklogIdea.find({
        projectId: testProjectId,
        hypothesisId: testHypothesisId
      })
        .limit(10000)
        .exec();

      const contentItems = await SeoContentItem.find({
        projectId: testProjectId,
        hypothesisId: testHypothesisId
      }).exec();

      const backlogIds = new Set(backlogItems.map(b => b._id.toString()));
      const contentBacklogIds = contentItems
        .filter(c => c.backlogIdeaId)
        .map(c => c.backlogIdeaId!.toString());

      const orphanedContent = contentBacklogIds.filter(id => !backlogIds.has(id));
      const backlogWithContent = backlogItems.filter(b => 
        contentItems.some(c => c.backlogIdeaId?.toString() === b._id.toString())
      );

      report.steps.backlog_content_link = {
        status: orphanedContent.length === 0 ? "ok" : "warning",
        message: `Связь проверена: ${backlogWithContent.length} backlog items имеют content`,
        data: {
          backlogItemsCount: backlogItems.length,
          contentItemsCount: contentItems.length,
          backlogWithContent: backlogWithContent.length,
          orphanedContent: orphanedContent.length,
          orphanedContentIds: orphanedContent
        }
      };

      console.log(`✅ Backlog items: ${backlogItems.length}`);
      console.log(`   Content items: ${contentItems.length}`);
      console.log(`   Backlog items с content: ${backlogWithContent.length}`);
      if (orphanedContent.length > 0) {
        console.log(`   ⚠️  Content items с несуществующим backlogIdeaId: ${orphanedContent.length}`);
      }
      console.log();
    } catch (error: any) {
      report.steps.backlog_content_link = {
        status: "error",
        message: `Ошибка при проверке связи: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 8: Проверка индексов MongoDB
    console.log("📋 ШАГ 8: Проверка индексов MongoDB");
    console.log("-----------------------------------");
    try {
      const backlogCollection = mongoose.connection.db.collection("seobacklogideas");
      const indexes = await backlogCollection.indexes();

      report.steps.mongodb_indexes = {
        status: "ok",
        message: `Найдено ${indexes.length} индексов`,
        data: {
          indexes: indexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique || false
          }))
        }
      };

      console.log(`✅ Индексы на коллекции seobacklogideas:`);
      indexes.forEach(idx => {
        console.log(`   - ${idx.name}:`, idx.key);
      });
      console.log();
    } catch (error: any) {
      report.steps.mongodb_indexes = {
        status: "error",
        message: `Ошибка при проверке индексов: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 9: Проверка на возможные лимиты в Mongoose схеме
    console.log("📋 ШАГ 9: Анализ Mongoose схемы");
    console.log("-----------------------------------");
    try {
      const schema = SeoBacklogIdea.schema;
      const schemaPaths = Object.keys(schema.paths);
      
      // Проверка на наличие каких-либо лимитов в схеме
      const schemaAnalysis = {
        paths: schemaPaths.length,
        hasIndexes: Object.keys(schema.indexes()).length > 0,
        indexes: schema.indexes()
      };

      report.steps.mongoose_schema = {
        status: "ok",
        message: `Схема проанализирована`,
        data: schemaAnalysis
      };

      console.log(`✅ Поля в схеме: ${schemaPaths.length}`);
      console.log(`   Индексы в схеме: ${Object.keys(schema.indexes()).length}`);
      console.log();
    } catch (error: any) {
      report.steps.mongoose_schema = {
        status: "error",
        message: `Ошибка при анализе схемы: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ШАГ 10: Тест прямого запроса через нативный MongoDB драйвер
    console.log("📋 ШАГ 10: Тест через нативный MongoDB драйвер");
    console.log("-----------------------------------");
    try {
      const backlogCollection = mongoose.connection.db.collection("seobacklogideas");
      
      const nativeQuery = {
        projectId: testProjectId,
        hypothesisId: testHypothesisId
      };

      const nativeCount = await backlogCollection.countDocuments(nativeQuery);
      const nativeDocs = await backlogCollection.find(nativeQuery)
        .sort({ updatedAt: -1 })
        .toArray();

      report.steps.native_mongodb = {
        status: nativeCount === nativeDocs.length ? "ok" : "warning",
        message: `Нативный драйвер: count=${nativeCount}, find=${nativeDocs.length}`,
        data: {
          count: nativeCount,
          findLength: nativeDocs.length,
          match: nativeCount === nativeDocs.length
        }
      };

      console.log(`✅ Нативный MongoDB драйвер:`);
      console.log(`   countDocuments(): ${nativeCount}`);
      console.log(`   find().toArray(): ${nativeDocs.length}`);
      if (nativeCount !== nativeDocs.length) {
        console.log(`   ⚠️  РАСХОЖДЕНИЕ!`);
      }
      console.log();
    } catch (error: any) {
      report.steps.native_mongodb = {
        status: "error",
        message: `Ошибка при нативном запросе: ${error.message}`,
        details: error
      };
      console.error("❌ Ошибка:", error.message);
    }

    // ИТОГОВЫЙ ОТЧЕТ
    console.log("📊 ИТОГОВЫЙ ОТЧЕТ");
    console.log("=====================================");
    
    const errors = Object.values(report.steps).filter(s => s.status === "error");
    const warnings = Object.values(report.steps).filter(s => s.status === "warning");
    const ok = Object.values(report.steps).filter(s => s.status === "ok");

    console.log(`✅ Успешно: ${ok.length}`);
    console.log(`⚠️  Предупреждения: ${warnings.length}`);
    console.log(`❌ Ошибки: ${errors.length}`);
    console.log();

    if (warnings.length > 0) {
      console.log("⚠️  ПРЕДУПРЕЖДЕНИЯ:");
      warnings.forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.message}`);
      });
      console.log();
    }

    if (errors.length > 0) {
      console.log("❌ ОШИБКИ:");
      errors.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.message}`);
      });
      console.log();
    }

    // Ключевые метрики
    const backlogData = report.steps.backlog_query?.data;
    if (backlogData) {
      console.log("🔑 КЛЮЧЕВЫЕ МЕТРИКИ:");
      console.log(`   Всего элементов в БД: ${backlogData.countDocuments}`);
      console.log(`   Получено через find(): ${backlogData.findLimit10000}`);
      console.log(`   Элементов со статусом PENDING (после маппинга): ${report.steps.status_mapping?.data?.pendingCount || "N/A"}`);
      console.log();
    }

    // Сохранение отчета
    const fs = await import("fs");
    const path = await import("path");
    const reportPath = path.join(process.cwd(), "..", "logs", `diagnostics-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
    console.log(`💾 Полный отчет сохранен: ${reportPath}`);

    await mongoose.disconnect();
    console.log("\n✅ Диагностика завершена");
  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

deepDiagnostics();

