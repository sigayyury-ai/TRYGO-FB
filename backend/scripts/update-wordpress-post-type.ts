import "dotenv/config";
import mongoose from "mongoose";
import { SeoSprintSettings } from "../src/db/models/SeoSprintSettings.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  const result = await SeoSprintSettings.updateMany(
    {
      wordpressBaseUrl: { $exists: true, $ne: null }
    },
    {
      $set: { wordpressPostType: "blog" }
    }
  ).exec();
  
  console.log(`✅ Обновлено настроек: ${result.modifiedCount}`);
  console.log("✅ WordPress Post Type установлен как 'blog'\n");
  
  // Проверяем результат
  const settings = await SeoSprintSettings.findOne({
    wordpressBaseUrl: { $exists: true, $ne: null }
  }).exec();
  
  if (settings) {
    console.log("📋 Обновленные настройки:");
    console.log("   WordPress Post Type:", (settings as any).wordpressPostType);
  }
  
  await mongoose.disconnect();
}

main();
