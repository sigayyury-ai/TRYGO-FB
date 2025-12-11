#!/usr/bin/env tsx

import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), "../.env") });
config({ path: resolve(process.cwd(), ".env") });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;

const projectId = process.argv[2] || "686774b6773b5947fed60a78";
const hypothesisId = process.argv[3] || "687fe5363c4cca83a3cc578d";

async function findPainIdeas() {
  await mongoose.connect(MONGODB_URI!);
  
  console.log(`Поиск идей для проекта ${projectId} и гипотезы ${hypothesisId}\n`);
  
  // Все идеи
  const allIdeas = await SeoBacklogIdea.find({ projectId, hypothesisId }).exec();
  console.log(`Всего идей: ${allIdeas.length}`);
  
  // Идеи категории pain
  const painIdeas = await SeoBacklogIdea.find({ 
    projectId, 
    hypothesisId,
    category: "pain"
  }).exec();
  
  console.log(`Идей категории PAIN: ${painIdeas.length}\n`);
  
  // Статистика по категориям
  const byCategory = await SeoBacklogIdea.aggregate([
    { $match: { projectId, hypothesisId } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  
  console.log("По категориям:");
  byCategory.forEach(({ _id, count }) => {
    console.log(`  ${_id}: ${count}`);
  });
  
  if (painIdeas.length > 0) {
    console.log(`\n\nПервые 10 идей категории PAIN:`);
    painIdeas.slice(0, 10).forEach((idea, i) => {
      console.log(`\n${i + 1}. ${idea.title}`);
      console.log(`   Описание: ${idea.description.substring(0, 100)}...`);
      console.log(`   ID: ${idea._id}`);
    });
  }
  
  await mongoose.disconnect();
}

findPainIdeas();


