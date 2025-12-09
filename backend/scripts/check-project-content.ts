#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = process.argv[2] || "686774b6773b5947fed60a78";

async function checkContent() {
  await mongoose.connect(MONGODB_URI!);
  
  const total = await SeoContentItem.countDocuments({ projectId });
  console.log(`Всего контента для проекта ${projectId}: ${total}`);
  
  const byHyp = await SeoContentItem.aggregate([
    { $match: { projectId } },
    { $group: { _id: "$hypothesisId", count: { $sum: 1 } } }
  ]);
  
  console.log("\nПо гипотезам:");
  byHyp.forEach(({ _id, count }) => {
    console.log(`  ${_id}: ${count}`);
  });
  
  await mongoose.disconnect();
}

checkContent();

