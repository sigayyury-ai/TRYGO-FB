import "dotenv/config";
import mongoose from "mongoose";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

// Simulate the mapping function from resolvers.ts
const toUpperEnum = (str: string): string => {
  return str.toUpperCase().replace(/-/g, "_");
};

const mapBacklogStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    backlog: "PENDING",
    scheduled: "SCHEDULED",
    archived: "ARCHIVED"
  };
  return statusMap[status.toLowerCase()] || toUpperEnum(status);
};

async function testBacklogMapping() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all backlog items
    const allItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    }).sort({ createdAt: 1 }).exec();

    console.log(`\n📊 Found ${allItems.length} backlog items`);

    // Test mapping
    console.log("\n📋 Status Mapping Test:");
    const statusCounts: Record<string, { original: number; mapped: string; count: number }> = {};
    
    allItems.forEach(item => {
      const originalStatus = item.status;
      const mappedStatus = mapBacklogStatus(originalStatus);
      
      if (!statusCounts[originalStatus]) {
        statusCounts[originalStatus] = {
          original: 0,
          mapped: mappedStatus,
          count: 0
        };
      }
      statusCounts[originalStatus].original++;
      statusCounts[originalStatus].count++;
    });

    Object.entries(statusCounts).forEach(([original, data]) => {
      console.log(`  "${original}" -> "${data.mapped}": ${data.count} items`);
    });

    // Count items that would be shown (PENDING)
    const pendingItems = allItems.filter(item => {
      const mapped = mapBacklogStatus(item.status);
      return mapped === "PENDING";
    });

    const nonPendingItems = allItems.filter(item => {
      const mapped = mapBacklogStatus(item.status);
      return mapped !== "PENDING";
    });

    console.log(`\n📊 Visibility after mapping:`);
    console.log(`  ✅ Would be shown (PENDING): ${pendingItems.length}`);
    console.log(`  ❌ Would be hidden (not PENDING): ${nonPendingItems.length}`);
    console.log(`  Total: ${allItems.length}`);

    if (nonPendingItems.length > 0) {
      console.log(`\n🔍 Hidden items (first 5):`);
      nonPendingItems.slice(0, 5).forEach(item => {
        const mapped = mapBacklogStatus(item.status);
        console.log(`  - [${item.status} -> ${mapped}] ${item.title.substring(0, 60)}...`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Test complete");
  } catch (error) {
    console.error("❌ Error testing backlog mapping:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testBacklogMapping();

