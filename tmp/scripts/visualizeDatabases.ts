import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// URI для обеих баз данных
const trygoUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/trygo$1") || "";
const testUri = process.env.MONGODB_URI?.replace(/\/[^/]+(\?|$)/, "/test$1") || "";

interface CollectionInfo {
  name: string;
  count: number;
  sampleDocument?: any;
  fields?: string[];
  indexes?: any[];
}

interface DatabaseInfo {
  name: string;
  uri: string;
  connected: boolean;
  collections: CollectionInfo[];
  totalDocuments: number;
}

async function visualizeDatabases() {
  console.log("🔍 ВИЗУАЛИЗАЦИЯ БАЗ ДАННЫХ");
  console.log("=" .repeat(80));
  console.log();

  const databases: DatabaseInfo[] = [];

  // 1. Анализ базы данных "trygo"
  console.log("📊 1. АНАЛИЗ БАЗЫ ДАННЫХ 'trygo'");
  console.log("-".repeat(80));

  try {
    await mongoose.connect(trygoUri);
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    console.log(`✅ Подключено к базе: ${dbName}`);
    
    const collections = await db.listCollections().toArray();
    console.log(`   Найдено коллекций: ${collections.length}`);
    console.log();

    const collectionInfos: CollectionInfo[] = [];
    let totalDocs = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = db.collection(collectionName);
      
      const count = await coll.countDocuments({});
      totalDocs += count;
      
      let sampleDoc: any = null;
      let fields: string[] = [];
      
      if (count > 0) {
        sampleDoc = await coll.findOne({});
        if (sampleDoc) {
          fields = Object.keys(sampleDoc);
        }
      }
      
      const indexes = await coll.indexes();
      
      collectionInfos.push({
        name: collectionName,
        count,
        sampleDocument: sampleDoc,
        fields: fields.slice(0, 20), // Первые 20 полей
        indexes
      });
      
      console.log(`   📁 ${collectionName}: ${count} документов`);
      if (fields.length > 0) {
        console.log(`      Поля: ${fields.slice(0, 10).join(", ")}${fields.length > 10 ? "..." : ""}`);
      }
    }
    
    databases.push({
      name: dbName,
      uri: trygoUri.replace(/\/\/.*@/, "//***:***@"),
      connected: true,
      collections: collectionInfos.sort((a, b) => b.count - a.count),
      totalDocuments: totalDocs
    });
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`❌ Ошибка подключения к 'trygo': ${error.message}`);
    databases.push({
      name: "trygo",
      uri: trygoUri.replace(/\/\/.*@/, "//***:***@"),
      connected: false,
      collections: [],
      totalDocuments: 0
    });
    console.log();
  }

  // 2. Анализ базы данных "test"
  console.log("📊 2. АНАЛИЗ БАЗЫ ДАННЫХ 'test'");
  console.log("-".repeat(80));

  try {
    await mongoose.connect(testUri);
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    console.log(`✅ Подключено к базе: ${dbName}`);
    
    const collections = await db.listCollections().toArray();
    console.log(`   Найдено коллекций: ${collections.length}`);
    console.log();

    const collectionInfos: CollectionInfo[] = [];
    let totalDocs = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      const coll = db.collection(collectionName);
      
      const count = await coll.countDocuments({});
      totalDocs += count;
      
      let sampleDoc: any = null;
      let fields: string[] = [];
      
      if (count > 0) {
        sampleDoc = await coll.findOne({});
        if (sampleDoc) {
          fields = Object.keys(sampleDoc);
        }
      }
      
      const indexes = await coll.indexes();
      
      collectionInfos.push({
        name: collectionName,
        count,
        sampleDocument: sampleDoc,
        fields: fields.slice(0, 20),
        indexes
      });
      
      console.log(`   📁 ${collectionName}: ${count} документов`);
      if (fields.length > 0) {
        console.log(`      Поля: ${fields.slice(0, 10).join(", ")}${fields.length > 10 ? "..." : ""}`);
      }
    }
    
    databases.push({
      name: dbName,
      uri: testUri.replace(/\/\/.*@/, "//***:***@"),
      connected: true,
      collections: collectionInfos.sort((a, b) => b.count - a.count),
      totalDocuments: totalDocs
    });
    
    await mongoose.disconnect();
    console.log();
  } catch (error: any) {
    console.log(`❌ Ошибка подключения к 'test': ${error.message}`);
    databases.push({
      name: "test",
      uri: testUri.replace(/\/\/.*@/, "//***:***@"),
      connected: false,
      collections: [],
      totalDocuments: 0
    });
    console.log();
  }

  // 3. Сравнение баз данных
  console.log("📊 3. СРАВНЕНИЕ БАЗ ДАННЫХ");
  console.log("=" .repeat(80));
  console.log();

  const trygoDb = databases.find(d => d.name === "trygo");
  const testDb = databases.find(d => d.name === "test");

  if (trygoDb && testDb) {
    console.log(`База 'trygo': ${trygoDb.totalDocuments} документов в ${trygoDb.collections.length} коллекциях`);
    console.log(`База 'test': ${testDb.totalDocuments} документов в ${testDb.collections.length} коллекциях`);
    console.log();

    // Находим общие коллекции
    const trygoCollectionNames = new Set(trygoDb.collections.map(c => c.name));
    const testCollectionNames = new Set(testDb.collections.map(c => c.name));
    
    const commonCollections = Array.from(trygoCollectionNames).filter(name => testCollectionNames.has(name));
    const onlyInTrygo = Array.from(trygoCollectionNames).filter(name => !testCollectionNames.has(name));
    const onlyInTest = Array.from(testCollectionNames).filter(name => !trygoCollectionNames.has(name));

    console.log(`Общие коллекции: ${commonCollections.length}`);
    console.log(`Только в 'trygo': ${onlyInTrygo.length}`);
    console.log(`Только в 'test': ${onlyInTest.length}`);
    console.log();

    if (commonCollections.length > 0) {
      console.log("📋 СРАВНЕНИЕ ОБЩИХ КОЛЛЕКЦИЙ:");
      console.log("-".repeat(80));
      console.log("| Коллекция | trygo | test | Разница |");
      console.log("|-----------|-------|------|---------|");
      
      for (const collectionName of commonCollections) {
        const trygoColl = trygoDb.collections.find(c => c.name === collectionName);
        const testColl = testDb.collections.find(c => c.name === collectionName);
        
        if (trygoColl && testColl) {
          const diff = trygoColl.count - testColl.count;
          const diffStr = diff > 0 ? `+${diff}` : diff.toString();
          console.log(`| ${collectionName} | ${trygoColl.count} | ${testColl.count} | ${diffStr} |`);
        }
      }
      console.log();
    }
  }

  // 4. Создание визуальных отчетов
  console.log("📋 4. СОЗДАНИЕ ВИЗУАЛЬНЫХ ОТЧЕТОВ");
  console.log("=" .repeat(80));
  console.log();

  const reportsDir = path.join(process.cwd(), "..", "logs");
  fs.mkdirSync(reportsDir, { recursive: true });

  // JSON отчет
  const jsonPath = path.join(reportsDir, `databases-visualization-${Date.now()}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(databases, null, 2), "utf-8");
  console.log(`💾 JSON отчет: ${jsonPath}`);

  // Markdown отчет с визуализацией
  const mdPath = path.join(reportsDir, `databases-visualization-${Date.now()}.md`);
  let mdContent = "# Визуализация баз данных\n\n";
  mdContent += `**Дата:** ${new Date().toISOString()}\n\n`;

  for (const db of databases) {
    mdContent += `## База данных: ${db.name}\n\n`;
    mdContent += `- **URI:** \`${db.uri}\`\n`;
    mdContent += `- **Статус:** ${db.connected ? "✅ Подключена" : "❌ Не подключена"}\n`;
    mdContent += `- **Всего документов:** ${db.totalDocuments.toLocaleString()}\n`;
    mdContent += `- **Коллекций:** ${db.collections.length}\n\n`;

    if (db.collections.length > 0) {
      mdContent += "### Коллекции\n\n";
      mdContent += "| Коллекция | Документов | Поля (первые 10) |\n";
      mdContent += "|-----------|------------|------------------|\n";
      
      for (const coll of db.collections) {
        const fieldsStr = coll.fields ? coll.fields.slice(0, 10).join(", ") : "нет данных";
        mdContent += `| \`${coll.name}\` | ${coll.count.toLocaleString()} | ${fieldsStr} |\n`;
      }
      mdContent += "\n";

      // Примеры документов
      mdContent += "### Примеры документов\n\n";
      for (const coll of db.collections.slice(0, 5)) {
        if (coll.sampleDocument) {
          mdContent += `#### Коллекция: \`${coll.name}\`\n\n`;
          mdContent += "```json\n";
          mdContent += JSON.stringify(coll.sampleDocument, null, 2).substring(0, 1000);
          if (JSON.stringify(coll.sampleDocument).length > 1000) {
            mdContent += "\n... (обрезано)";
          }
          mdContent += "\n```\n\n";
        }
      }
    }
    mdContent += "\n---\n\n";
  }

  // Сравнительная таблица
  if (trygoDb && testDb && trygoDb.connected && testDb.connected) {
    mdContent += "## Сравнительная таблица\n\n";
    mdContent += "| Коллекция | trygo | test | Разница |\n";
    mdContent += "|-----------|-------|------|---------|\n";
    
    const allCollectionNames = new Set([
      ...trygoDb.collections.map(c => c.name),
      ...testDb.collections.map(c => c.name)
    ]);
    
    for (const name of Array.from(allCollectionNames).sort()) {
      const trygoColl = trygoDb.collections.find(c => c.name === name);
      const testColl = testDb.collections.find(c => c.name === name);
      
      const trygoCount = trygoColl?.count || 0;
      const testCount = testColl?.count || 0;
      const diff = trygoCount - testCount;
      const diffStr = diff > 0 ? `+${diff}` : diff === 0 ? "=" : diff.toString();
      
      mdContent += `| \`${name}\` | ${trygoCount} | ${testCount} | ${diffStr} |\n`;
    }
    mdContent += "\n";
  }

  fs.writeFileSync(mdPath, mdContent, "utf-8");
  console.log(`💾 Markdown отчет: ${mdPath}`);

  // CSV отчет
  const csvPath = path.join(reportsDir, `databases-comparison-${Date.now()}.csv`);
  let csvContent = "Database,Collection,Documents,Fields\n";
  
  for (const db of databases) {
    for (const coll of db.collections) {
      const fieldsStr = coll.fields ? coll.fields.join("; ") : "";
      csvContent += `"${db.name}","${coll.name}",${coll.count},"${fieldsStr}"\n`;
    }
  }
  
  fs.writeFileSync(csvPath, csvContent, "utf-8");
  console.log(`💾 CSV отчет: ${csvPath}`);

  console.log();
  console.log("✅ Все отчеты созданы!");
}

visualizeDatabases();

