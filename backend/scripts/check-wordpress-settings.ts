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
  
  const settings = await SeoSprintSettings.findOne({
    wordpressBaseUrl: { $exists: true, $ne: null }
  }).exec();
  
  if (!settings) {
    console.log("❌ Настройки WordPress не найдены");
    process.exit(1);
  }
  
  console.log("📋 Текущие настройки WordPress:");
  console.log("   Project ID:", settings.projectId);
  console.log("   Hypothesis ID:", settings.hypothesisId);
  console.log("   WordPress URL:", settings.wordpressBaseUrl);
  console.log("   WordPress Username:", settings.wordpressUsername);
  console.log("   WordPress Post Type:", (settings as any).wordpressPostType || "post (по умолчанию)");
  console.log("   Default Category ID:", (settings as any).wordpressDefaultCategoryId || "не установлена");
  console.log("   Default Tag IDs:", (settings as any).wordpressDefaultTagIds || []);
  
  if (!(settings as any).wordpressPostType || (settings as any).wordpressPostType === "post") {
    console.log("\n⚠️  WordPress Post Type не установлен или установлен как 'post'");
    console.log("💡 Нужно установить 'blog' в настройках WordPress в интерфейсе");
  } else {
    console.log("\n✅ WordPress Post Type установлен:", (settings as any).wordpressPostType);
  }
  
  await mongoose.disconnect();
}

main();
