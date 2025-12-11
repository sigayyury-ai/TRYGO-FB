import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

async function checkContentByDate() {
  await mongoose.connect(MONGODB_URI);
  
  // Get all items
  const allItems = await SeoContentItem.find({
    projectId: testProjectId,
    hypothesisId: testHypothesisId,
    status: { $ne: "archived" }
  }).exec();
  
  console.log(`Total items: ${allItems.length}\n`);
  
  // Check items from 16/11/2025
  const nov16Items = allItems.filter(item => {
    const date = item.createdAt;
    return date.getFullYear() === 2025 && date.getMonth() === 10 && date.getDate() === 16;
  });
  
  // Check items from 9/12/2025
  const dec9Items = allItems.filter(item => {
    const date = item.createdAt;
    return date.getFullYear() === 2025 && date.getMonth() === 11 && date.getDate() === 9;
  });
  
  console.log(`Items from 16/11/2025: ${nov16Items.length}`);
  if (nov16Items.length > 0) {
    const byStatus = nov16Items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`  By status:`, byStatus);
    console.log(`  Sample titles:`);
    nov16Items.slice(0, 3).forEach(item => {
      console.log(`    - ${item.title} (status: ${item.status}, backlogIdeaId: ${item.backlogIdeaId ? 'yes' : 'no'})`);
    });
  }
  
  console.log(`\nItems from 9/12/2025: ${dec9Items.length}`);
  if (dec9Items.length > 0) {
    const byStatus = dec9Items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`  By status:`, byStatus);
    console.log(`  Sample titles:`);
    dec9Items.slice(0, 5).forEach(item => {
      console.log(`    - ${item.title} (status: ${item.status}, backlogIdeaId: ${item.backlogIdeaId ? 'yes' : 'no'})`);
    });
  }
  
  // Check mapping
  console.log(`\n📊 Status mapping (how they appear in frontend):`);
  console.log(`  draft → NEW`);
  console.log(`  review → NEW`);
  console.log(`  ready → NEW`);
  console.log(`  published → ADDED_TO_BACKLOG`);
  console.log(`  archived → DISMISSED (filtered out)`);
  
  // Check if items with backlogIdeaId are filtered
  const withBacklog = allItems.filter(item => item.backlogIdeaId);
  const withoutBacklog = allItems.filter(item => !item.backlogIdeaId);
  
  console.log(`\n📋 BacklogIdeaId breakdown:`);
  console.log(`  With backlogIdeaId: ${withBacklog.length}`);
  console.log(`  Without backlogIdeaId: ${withoutBacklog.length}`);
  
  // Check if published items are filtered
  const publishedItems = allItems.filter(item => item.status === "published");
  console.log(`\n📰 Published items: ${publishedItems.length}`);
  if (publishedItems.length > 0) {
    console.log(`  These map to status: ADDED_TO_BACKLOG`);
    console.log(`  Sample:`);
    publishedItems.slice(0, 3).forEach(item => {
      console.log(`    - ${item.title}`);
    });
  }
  
  await mongoose.disconnect();
}

checkContentByDate();


