import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

async function checkRemainingItem() {
  await mongoose.connect(MONGODB_URI);
  
  const item = await SeoContentItem.findOne({
    projectId: testProjectId,
    hypothesisId: testHypothesisId,
    backlogIdeaId: { $exists: false }
  }).exec();
  
  if (item) {
    console.log("Item without backlogIdeaId:", item.title);
    console.log("Created:", item.createdAt);
    console.log("Category:", item.category);
    
    // Create backlog item for it
    const backlogItem = await SeoBacklogIdea.create({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      title: item.title,
      description: item.outline || item.title,
      status: "pending",
      category: item.category,
      createdBy: item.createdBy || "system",
      updatedBy: item.updatedBy || "system"
    });
    
    await SeoContentItem.findByIdAndUpdate(item._id, {
      backlogIdeaId: backlogItem._id.toString()
    }).exec();
    
    console.log("✅ Created backlog item and linked it");
  } else {
    console.log("✅ No items without backlogIdeaId found");
  }
  
  await mongoose.disconnect();
}

checkRemainingItem();


