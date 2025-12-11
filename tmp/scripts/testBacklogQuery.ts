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

// Simulate the query from resolvers.ts
async function testBacklogQuery() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Simulate the exact query from seoAgentBacklog resolver
    const query: Record<string, unknown> = {
      projectId: testProjectId
    };
    
    if (testHypothesisId && testHypothesisId.trim() !== "") {
      query.hypothesisId = testHypothesisId;
    }
    
    console.log("\n📋 MongoDB query:", query);
    
    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .exec();
    
    console.log(`\n📊 Found ${docs.length} items`);
    
    // Simulate mapping
    const toUpperEnum = (value: string) => value.toUpperCase();
    const mapBacklogStatus = (status: string): string => {
      const statusMap: Record<string, string> = {
        backlog: "PENDING",
        scheduled: "SCHEDULED",
        archived: "ARCHIVED"
      };
      return statusMap[status.toLowerCase()] || toUpperEnum(status);
    };

    const mappedItems = docs.map(doc => ({
      id: doc._id.toString(),
      status: mapBacklogStatus(doc.status),
      originalStatus: doc.status,
      title: doc.title
    }));

    // Count by mapped status
    const byMappedStatus = mappedItems.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push(item);
      return acc;
    }, {} as Record<string, typeof mappedItems>);

    console.log("\n📊 Items by mapped status:");
    Object.entries(byMappedStatus).forEach(([status, items]) => {
      console.log(`  ${status}: ${items.length} items`);
    });

    const pendingCount = mappedItems.filter(item => item.status === "PENDING").length;
    console.log(`\n✅ Items that would be shown (PENDING): ${pendingCount}`);
    console.log(`❌ Items that would be hidden: ${mappedItems.length - pendingCount}`);

    // Check if there are any other filters that might apply
    console.log("\n🔍 Checking for other potential issues:");
    
    // Check for null/undefined fields
    const withNullTitle = docs.filter(d => !d.title || d.title.trim() === "");
    if (withNullTitle.length > 0) {
      console.log(`  ⚠️  ${withNullTitle.length} items have empty/null title`);
    }

    // Check contentType (if it exists in the model)
    console.log("\n📋 Sample items (first 5):");
    mappedItems.slice(0, 5).forEach(item => {
      console.log(`  - [${item.originalStatus} -> ${item.status}] ${item.title.substring(0, 60)}...`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Test complete");
  } catch (error) {
    console.error("❌ Error testing backlog query:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testBacklogQuery();

