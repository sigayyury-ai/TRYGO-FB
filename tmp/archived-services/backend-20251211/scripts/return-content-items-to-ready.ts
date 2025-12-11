import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function main() {
  console.log("🔄 ===== ВОЗВРАТ CONTENT ITEMS В READY =====");
  
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  // Найти все content items со статусом published
  const publishedContentItems = await SeoContentItem.find({
    status: "published"
  }).exec();
  
  console.log(`📋 Найдено опубликованных content items: ${publishedContentItems.length}\n`);
  
  if (publishedContentItems.length === 0) {
    console.log("✅ Нет опубликованных content items для возврата");
    await mongoose.disconnect();
    return;
  }
  
  let returned = 0;
  let errors = 0;
  
  for (const item of publishedContentItems) {
    try {
      console.log(`\n📝 Обработка content item: ${item.id}`);
      console.log(`   Заголовок: ${item.title}`);
      console.log(`   Текущий статус: ${item.status}`);
      
      // Изменить статус на ready
      item.status = "ready";
      await item.save();
      
      console.log(`   ✅ Статус изменен на: ready`);
      
      returned++;
    } catch (error: any) {
      console.error(`   ❌ Ошибка при обработке ${item.id}:`, error.message);
      errors++;
    }
  }
  
  console.log("\n✅ ===== ОБРАБОТКА ЗАВЕРШЕНА =====");
  console.log(`✅ Возвращено в ready: ${returned}`);
  console.log(`❌ Ошибок: ${errors}`);
  
  await mongoose.disconnect();
  console.log("\n📦 Отключено от MongoDB");
}

main();
