import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  const scheduledItems = await SeoBacklogIdea.find({
    status: "scheduled"
  }).exec();
  
  console.log(`📋 Найдено запланированных материалов: ${scheduledItems.length}\n`);
  
  if (scheduledItems.length > 0) {
    console.log("📝 Запланированные материалы:");
    for (const item of scheduledItems) {
      console.log(`   - ${item.id}: ${item.title}`);
      console.log(`     Scheduled Date: ${item.scheduledDate}`);
    }
    console.log("\n💡 Эти материалы остаются в спринте. Если нужно вернуть их в беклог, запустите скрипт для scheduled items.");
  } else {
    console.log("✅ Нет запланированных материалов");
  }
  
  await mongoose.disconnect();
}

main();
