import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is required");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Подключено к MongoDB\n");
  
  const contentItem = await SeoContentItem.findById("693af31c198ef286571a7e73").exec();
  
  if (contentItem) {
    console.log("📄 Content Item:", contentItem.id);
    console.log("🖼️  Image URL:", contentItem.imageUrl ? contentItem.imageUrl.substring(0, 100) + "..." : "НЕТ");
    console.log("📋 Title:", contentItem.title);
  } else {
    console.log("❌ Content item не найден");
  }
  
  await mongoose.disconnect();
}

main();
