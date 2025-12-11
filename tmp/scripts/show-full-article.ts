#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";

async function showFullArticle() {
  await mongoose.connect(MONGODB_URI!);
  
  const item = await SeoContentItem.findOne({
    projectId,
    hypothesisId,
    category: "pain"
  }).sort({ createdAt: -1 }).exec();
  
  if (!item || !item.content) {
    console.log("Статья не найдена");
    await mongoose.disconnect();
    return;
  }
  
  const words = item.content.split(/\s+/).filter(w => w.length > 0).length;
  
  console.log("=".repeat(80));
  console.log("ПОЛНЫЙ ТЕКСТ СГЕНЕРИРОВАННОЙ СТАТЬИ");
  console.log("=".repeat(80));
  console.log(`\nЗаголовок: ${item.title}`);
  console.log(`Объем: ${words} слов`);
  console.log(`ID: ${item._id}\n`);
  console.log("=".repeat(80));
  console.log("\n" + item.content);
  console.log("\n" + "=".repeat(80));
  
  await mongoose.disconnect();
}

showFullArticle();


