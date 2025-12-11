import "dotenv/config";
import mongoose from "mongoose";
import { SeoSprintSettings } from "../src/db/models/SeoSprintSettings.js";
import { uploadImageToWordPress } from "../src/services/wordpress/imageUpload.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function main() {
  console.log("🧪 ===== ТЕСТ ЗАГРУЗКИ ИЗОБРАЖЕНИЯ =====");
  
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  const settings = await SeoSprintSettings.findOne({
    wordpressBaseUrl: { $exists: true, $ne: null }
  }).exec();
  
  if (!settings) {
    console.error("❌ Настройки WordPress не найдены");
    process.exit(1);
  }
  
  const testImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  
  console.log("🖼️  Тестовое изображение (base64):", testImageUrl.substring(0, 50) + "...");
  
  const mediaId = await uploadImageToWordPress(testImageUrl, {
    baseUrl: settings.wordpressBaseUrl!.replace(/\/$/, ""),
    username: settings.wordpressUsername!,
    appPassword: settings.wordpressAppPassword!
  });
  
  if (mediaId) {
    console.log("✅ Изображение загружено, media ID:", mediaId);
  } else {
    console.error("❌ Не удалось загрузить изображение");
  }
  
  await mongoose.disconnect();
}

main();
