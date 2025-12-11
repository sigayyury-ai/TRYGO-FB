#!/usr/bin/env node

/**
 * Скрипт для проверки всех коллекций с контентом
 */

const mongoose = require("mongoose");
const { config } = require("dotenv");
const { resolve } = require("path");

config({ path: resolve(__dirname, "../.env") });
config({ path: resolve(__dirname, "../backend/.env") });
config({ path: resolve(__dirname, "../.env.local") });
config({ path: resolve(__dirname, "../backend/.env.local") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI не установлен в .env");
  process.exit(1);
}

async function checkAllCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Подключено к MongoDB\n");

    const db = mongoose.connection.db;
    
    // Получаем все проекты
    const projects = await db.collection("projects").find({}).toArray();
    
    if (projects.length === 0) {
      console.log("❌ Проекты не найдены");
      return;
    }

    console.log(`📊 Проверяем коллекции для ${projects.length} проекта(ов)\n`);
    console.log("=".repeat(80));

    for (const project of projects) {
      const projectId = project._id.toString();
      const projectTitle = project.title || "Без названия";
      
      console.log(`\n📁 Проект: ${projectTitle}`);
      console.log(`   ID: ${projectId}`);
      console.log("-".repeat(80));

      // 1. SeoContentItem (основная коллекция контента)
      const seoContentItems = await db.collection("seocontentitems").find({ projectId }).toArray();
      console.log(`\n1️⃣ SeoContentItem (seocontentitems):`);
      console.log(`   Всего: ${seoContentItems.length}`);
      
      if (seoContentItems.length > 0) {
        const byCategory = {};
        const byStatus = {};
        seoContentItems.forEach(item => {
          byCategory[item.category] = (byCategory[item.category] || 0) + 1;
          byStatus[item.status] = (byStatus[item.status] || 0) + 1;
        });
        
        console.log(`   По категориям:`);
        Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
          console.log(`      ${cat.padEnd(15)} ${count}`);
        });
        
        console.log(`   По статусам:`);
        Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
          console.log(`      ${status.padEnd(15)} ${count}`);
        });
      }

      // 2. seoBacklogIdeas (бэклог идей)
      const backlogIdeas = await db.collection("seobacklogideas").find({ projectId }).toArray();
      console.log(`\n2️⃣ seoBacklogIdeas (seobacklogideas):`);
      console.log(`   Всего: ${backlogIdeas.length}`);
      
      if (backlogIdeas.length > 0) {
        console.log(`   Примеры (первые 5):`);
        backlogIdeas.slice(0, 5).forEach((item, idx) => {
          console.log(`      ${idx + 1}. ${item.title?.substring(0, 60) || "Без названия"}${item.title?.length > 60 ? "..." : ""}`);
        });
      }

      // 3. seoContentQueue (очередь контента)
      const contentQueue = await db.collection("seocontentqueue").find({ projectId }).toArray();
      console.log(`\n3️⃣ seoContentQueue (seocontentqueue):`);
      console.log(`   Всего: ${contentQueue.length}`);

      // 4. Проверяем все коллекции, которые могут содержать контент
      const allCollections = await db.listCollections().toArray();
      const contentRelatedCollections = allCollections.filter(col => 
        col.name.toLowerCase().includes("content") || 
        col.name.toLowerCase().includes("backlog") ||
        col.name.toLowerCase().includes("seo")
      );

      console.log(`\n4️⃣ Другие связанные коллекции:`);
      for (const col of contentRelatedCollections) {
        if (!["seocontentitems", "seobacklogideas", "seocontentqueue"].includes(col.name)) {
          const count = await db.collection(col.name).countDocuments({ projectId });
          if (count > 0) {
            console.log(`   ${col.name}: ${count}`);
          }
        }
      }

      // 5. Проверяем все документы с projectId в любых коллекциях
      console.log(`\n5️⃣ Поиск всех документов с projectId в других коллекциях:`);
      const otherCollections = ["seoclusters", "seosprintsettings"];
      for (const colName of otherCollections) {
        try {
          const count = await db.collection(colName).countDocuments({ projectId });
          if (count > 0) {
            console.log(`   ${colName}: ${count}`);
          }
        } catch (e) {
          // Коллекция может не существовать
        }
      }

      // 6. Ищем документы без категории или с неправильной категорией
      if (seoContentItems.length > 0) {
        const withoutCategory = seoContentItems.filter(item => !item.category);
        const withNullCategory = seoContentItems.filter(item => item.category === null || item.category === undefined);
        
        if (withoutCategory.length > 0 || withNullCategory.length > 0) {
          console.log(`\n⚠️  Найдены документы без категории:`);
          console.log(`   Без поля category: ${withoutCategory.length}`);
          console.log(`   С null/undefined: ${withNullCategory.length}`);
        }
      }

      console.log("\n" + "=".repeat(80));
    }

    // Общая статистика
    const totalSeoContent = await db.collection("seocontentitems").countDocuments({});
    const totalBacklog = await db.collection("seobacklogideas").countDocuments({});
    
    console.log(`\n📊 ОБЩАЯ СТАТИСТИКА:`);
    console.log(`   SeoContentItem: ${totalSeoContent}`);
    console.log(`   seoBacklogIdeas: ${totalBacklog}`);
    console.log(`   Всего единиц контента: ${totalSeoContent + totalBacklog}`);

  } catch (error) {
    console.error("❌ Ошибка:", error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Отключено от MongoDB");
  }
}

checkAllCollections();






