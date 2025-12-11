import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";

interface BackupConfig {
  sourceDb: string;
  sourceUri: string;
  collections: string[];
  description: string;
}

const backupConfigs: BackupConfig[] = [
  {
    sourceDb: "test",
    sourceUri: testUri,
    collections: [
      "users",
      "projects",
      "projectHypotheses",
      "hypothesesCores",
      "hypothesesPersonProfiles",
      "subscriptions",
      "seoAgentBacklogIdeas",
      "seocontentitems",
      "seoclusters",
      "seoSprintSettings"
    ],
    description: "Основные коллекции из базы test"
  },
  {
    sourceDb: "trygo",
    sourceUri: trygoUri,
    collections: [
      "seocontentitems",
      "seobacklogideas",
      "seoclusters",
      "projects",
      "projectHypotheses",
      "hypothesesCores",
      "hypothesesPersonProfiles"
    ],
    description: "Основные коллекции из базы trygo"
  }
];

async function backupCollection(
  db: mongoose.mongo.Db,
  collectionName: string,
  backupDir: string
): Promise<{ count: number; filePath: string }> {
  const collection = db.collection(collectionName);
  const count = await collection.countDocuments({});
  
  if (count === 0) {
    console.log(`   ⚠️  Коллекция пуста, пропускаем`);
    return { count: 0, filePath: "" };
  }

  const documents = await collection.find({}).toArray();
  
  // Преобразуем ObjectId в строки для JSON
  const cleanDocuments = documents.map(doc => {
    const clean: any = { ...doc };
    if (clean._id) {
      clean._id = clean._id.toString();
    }
    // Преобразуем все Date в ISO строки
    Object.keys(clean).forEach(key => {
      if (clean[key] instanceof Date) {
        clean[key] = clean[key].toISOString();
      }
    });
    return clean;
  });

  const fileName = `${collectionName}-backup-${Date.now()}.json`;
  const filePath = path.join(backupDir, fileName);
  
  fs.writeFileSync(filePath, JSON.stringify(cleanDocuments, null, 2), "utf-8");
  
  const fileSize = (fs.statSync(filePath).size / 1024).toFixed(2);
  
  return { count, filePath: fileName };
}

async function backupAllCollections() {
  console.log("💾 БЭКАП ВСЕХ КОЛЛЕКЦИЙ");
  console.log("=" .repeat(80));
  console.log();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupBaseDir = path.join(process.cwd(), "..", "logs", "backups", timestamp);
  fs.mkdirSync(backupBaseDir, { recursive: true });

  console.log(`📁 Директория для бэкапов: ${backupBaseDir}`);
  console.log();

  for (const config of backupConfigs) {
    console.log(`📊 БЭКАП БАЗЫ ДАННЫХ: ${config.sourceDb}`);
    console.log("-".repeat(80));
    console.log(`Описание: ${config.description}`);
    console.log();

    try {
      await mongoose.connect(config.sourceUri);
      const db = mongoose.connection.db;
      console.log(`✅ Подключено к базе: ${db.databaseName}`);
      console.log();

      const dbBackupDir = path.join(backupBaseDir, config.sourceDb);
      fs.mkdirSync(dbBackupDir, { recursive: true });

      const backupResults: Array<{ collection: string; count: number; file: string }> = [];

      for (const collectionName of config.collections) {
        console.log(`📦 Бэкап коллекции: ${collectionName}`);
        try {
          const result = await backupCollection(db, collectionName, dbBackupDir);
          if (result.count > 0) {
            backupResults.push({
              collection: collectionName,
              count: result.count,
              file: result.filePath
            });
            console.log(`   ✅ Сохранено: ${result.count} документов → ${result.filePath}`);
          }
        } catch (error: any) {
          console.log(`   ❌ Ошибка: ${error.message}`);
        }
        console.log();
      }

      await mongoose.disconnect();

      // Создание отчета
      const reportPath = path.join(dbBackupDir, "backup-report.json");
      const report = {
        timestamp: new Date().toISOString(),
        database: config.sourceDb,
        description: config.description,
        collections: backupResults,
        totalDocuments: backupResults.reduce((sum, r) => sum + r.count, 0)
      };
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
      console.log(`💾 Отчет сохранен: ${reportPath}`);
      console.log();

    } catch (error: any) {
      console.log(`❌ Ошибка подключения к ${config.sourceDb}: ${error.message}`);
      console.log();
    }
  }

  // Итоговый отчет
  console.log("=" .repeat(80));
  console.log("✅ БЭКАП ЗАВЕРШЕН");
  console.log("=" .repeat(80));
  console.log();
  console.log(`📁 Все бэкапы сохранены в: ${backupBaseDir}`);
  console.log();
  console.log("📋 Структура директорий:");
  console.log(`   ${backupBaseDir}/`);
  console.log(`   ├── test/`);
  console.log(`   │   ├── backup-report.json`);
  console.log(`   │   └── *.json (файлы коллекций)`);
  console.log(`   └── trygo/`);
  console.log(`       ├── backup-report.json`);
  console.log(`       └── *.json (файлы коллекций)`);
}

// Запускаем автоматически
backupAllCollections().then(() => {
  process.exit(0);
}).catch(error => {
  console.error("❌ Критическая ошибка:", error);
  process.exit(1);
});

