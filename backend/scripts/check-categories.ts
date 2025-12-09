#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = "686774b6773b5947fed60a78";
const hypothesisId = "687fe5363c4cca83a3cc578d";

async function checkCategories() {
  await mongoose.connect(MONGODB_URI!);
  
  const ideas = await SeoBacklogIdea.find({ projectId, hypothesisId }).exec();
  
  console.log(`Всего идей: ${ideas.length}\n`);
  
  const byCategory: Record<string, number> = {};
  ideas.forEach(i => {
    byCategory[i.category] = (byCategory[i.category] || 0) + 1;
  });
  
  console.log("По категориям:");
  Object.entries(byCategory).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
  
  console.log("\nПримеры идей по категориям:");
  const categories = ["pain", "goal", "trigger", "feature", "benefit", "faq", "info"];
  categories.forEach(cat => {
    const idea = ideas.find(i => i.category === cat);
    if (idea) {
      console.log(`\n${cat.toUpperCase()}:`);
      console.log(`  ${idea.title}`);
    } else {
      console.log(`\n${cat.toUpperCase()}: ❌ Нет идей`);
    }
  });
  
  await mongoose.disconnect();
}

checkCategories();

