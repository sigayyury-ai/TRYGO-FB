import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { mapContentIdea } from "../src/schema/resolvers.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

async function testBackendResponse() {
  await mongoose.connect(MONGODB_URI);
  
  const items = await SeoContentItem.find({
    projectId: testProjectId,
    hypothesisId: testHypothesisId,
    status: { $ne: "archived" }
  }).sort({ createdAt: 1 }).exec();
  
  console.log(`Total items: ${items.length}\n`);
  
  // Check first 10 items
  console.log("First 10 items (oldest):");
  items.slice(0, 10).forEach(item => {
    const mapped = mapContentIdea(item);
    console.log(`  - ${item.title.substring(0, 50)}...`);
    console.log(`    Status: ${item.status} → ${mapped.status}`);
    console.log(`    Dismissed: ${mapped.dismissed}`);
    console.log(`    BacklogIdeaId: ${item.backlogIdeaId ? 'yes' : 'no'}`);
    console.log(`    Created: ${item.createdAt.toISOString().substring(0, 10)}`);
    console.log();
  });
  
  // Check last 10 items
  console.log("\nLast 10 items (newest):");
  items.slice(-10).forEach(item => {
    const mapped = mapContentIdea(item);
    console.log(`  - ${item.title.substring(0, 50)}...`);
    console.log(`    Status: ${item.status} → ${mapped.status}`);
    console.log(`    Dismissed: ${mapped.dismissed}`);
    console.log(`    BacklogIdeaId: ${item.backlogIdeaId ? 'yes' : 'no'}`);
    console.log(`    Created: ${item.createdAt.toISOString().substring(0, 10)}`);
    console.log();
  });
  
  // Count by mapped status
  const byMappedStatus = items.reduce((acc, item) => {
    const mapped = mapContentIdea(item);
    acc[mapped.status] = (acc[mapped.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("\nBy mapped status:");
  console.log(byMappedStatus);
  
  // Count by dismissed
  const dismissedCount = items.filter(item => {
    const mapped = mapContentIdea(item);
    return mapped.dismissed;
  }).length;
  
  console.log(`\nDismissed items: ${dismissedCount}`);
  
  await mongoose.disconnect();
}

testBackendResponse();


