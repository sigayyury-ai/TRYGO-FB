import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function main() {
  console.log("🔄 ===== ВОЗВРАТ ОПУБЛИКОВАННЫХ МАТЕРИАЛОВ В БЕКЛОГ =====");
  
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  // Найти все материалы со статусом in_progress (опубликованные)
  const publishedItems = await SeoBacklogIdea.find({
    status: "in_progress"
  }).exec();
  
  console.log(`📋 Найдено опубликованных материалов: ${publishedItems.length}\n`);
  
  if (publishedItems.length === 0) {
    console.log("✅ Нет опубликованных материалов для возврата");
    await mongoose.disconnect();
    return;
  }
  
  let returned = 0;
  let errors = 0;
  
  for (const item of publishedItems) {
    try {
      console.log(`\n📝 Обработка материала: ${item.id}`);
      console.log(`   Заголовок: ${item.title}`);
      console.log(`   Текущий статус: ${item.status}`);
      console.log(`   Scheduled Date: ${item.scheduledDate}`);
      
      // Изменить статус на pending
      item.status = "pending";
      item.scheduledDate = undefined;
      await item.save();
      
      console.log(`   ✅ Статус изменен на: pending`);
      console.log(`   ✅ Scheduled Date очищен`);
      
      // Также изменить статус content item обратно на ready
      const contentItem = await SeoContentItem.findOne({
        backlogIdeaId: item.id
      }).exec();
      
      if (contentItem) {
        if (contentItem.status === "published") {
          contentItem.status = "ready";
          await contentItem.save();
          console.log(`   ✅ Content item статус изменен на: ready`);
        } else {
          console.log(`   ℹ️  Content item уже имеет статус: ${contentItem.status}`);
        }
      } else {
        console.log(`   ⚠️  Content item не найден`);
      }
      
      returned++;
    } catch (error: any) {
      console.error(`   ❌ Ошибка при обработке ${item.id}:`, error.message);
      errors++;
    }
  }
  
  console.log("\n✅ ===== ОБРАБОТКА ЗАВЕРШЕНА =====");
  console.log(`✅ Возвращено в беклог: ${returned}`);
  console.log(`❌ Ошибок: ${errors}`);
  
  await mongoose.disconnect();
  console.log("\n📦 Отключено от MongoDB");
}

main();
