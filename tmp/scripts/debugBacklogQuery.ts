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

async function debugBacklogQuery() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Exact query from resolver
    const query: Record<string, unknown> = {
      projectId: testProjectId
    };
    
    if (testHypothesisId && testHypothesisId.trim() !== "") {
      query.hypothesisId = testHypothesisId;
    }
    
    console.log("\n📋 Query:", JSON.stringify(query, null, 2));
    
    // Count with exact query
    const countWithHypothesis = await SeoBacklogIdea.countDocuments(query);
    console.log(`\n📊 Count with hypothesisId: ${countWithHypothesis}`);
    
    // Count without hypothesisId
    const countWithoutHypothesis = await SeoBacklogIdea.countDocuments({
      projectId: testProjectId
    });
    console.log(`📊 Count without hypothesisId: ${countWithoutHypothesis}`);
    
    // Get items with exact query
    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .exec();
    
    console.log(`\n📊 Found ${docs.length} items with exact query`);
    
    // Check if there are items with different hypothesisId
    const allProjectItems = await SeoBacklogIdea.find({
      projectId: testProjectId
    }).exec();
    
    console.log(`\n📊 Total items for project (all hypotheses): ${allProjectItems.length}`);
    
    // Group by hypothesisId
    const byHypothesis = allProjectItems.reduce((acc, item) => {
      const hId = item.hypothesisId || "null";
      if (!acc[hId]) acc[hId] = [];
      acc[hId].push(item);
      return acc;
    }, {} as Record<string, typeof allProjectItems>);
    
    console.log("\n📊 Items by hypothesisId:");
    Object.entries(byHypothesis).forEach(([hId, items]) => {
      console.log(`  ${hId}: ${items.length} items`);
      if (hId !== testHypothesisId && items.length > 0) {
        console.log(`    Sample: ${items[0].title.substring(0, 60)}...`);
      }
    });
    
    // Check if there are items with null/undefined hypothesisId
    const nullHypothesis = allProjectItems.filter(item => !item.hypothesisId);
    if (nullHypothesis.length > 0) {
      console.log(`\n⚠️  Found ${nullHypothesis.length} items with null/undefined hypothesisId`);
    }
    
    // Check status distribution for target hypothesis
    const statusCounts = docs.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\n📊 Status distribution for target hypothesis:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    await mongoose.disconnect();
    console.log("\n✅ Debug complete");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugBacklogQuery();

