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

async function checkBacklogQueryDirect() {
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
    
    console.log("\n📋 MongoDB query:", JSON.stringify(query, null, 2));
    
    // Count total
    const totalCount = await SeoBacklogIdea.countDocuments(query);
    console.log(`\n📊 Total count: ${totalCount}`);
    
    // Get all items
    const docs = await SeoBacklogIdea.find(query)
      .sort({ updatedAt: -1 })
      .exec();
    
    console.log(`📊 Found ${docs.length} items (after find)`);
    
    // Check status distribution
    const statusCounts = docs.reduce((acc, doc) => {
      acc[doc.status] = (acc[doc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\n📊 Status distribution in DB:");
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check pending/backlog items
    const pendingItems = docs.filter(d => d.status === "pending" || d.status === "backlog");
    console.log(`\n✅ Items that will map to PENDING: ${pendingItems.length}`);
    console.log(`   - "pending": ${docs.filter(d => d.status === "pending").length}`);
    console.log(`   - "backlog": ${docs.filter(d => d.status === "backlog").length}`);
    
    // Check if there's a limit somewhere
    if (docs.length < totalCount) {
      console.log(`\n⚠️  WARNING: find() returned ${docs.length} items but countDocuments() returned ${totalCount}`);
      console.log(`   This suggests a limit is being applied somewhere.`);
    }
    
    // Check dates to see if there's a pattern
    const dates = docs.map(d => d.updatedAt.toISOString().substring(0, 10));
    const dateCounts = dates.reduce((acc, date) => {
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log("\n📅 Items by update date (first 10 dates):");
    Object.entries(dateCounts).slice(0, 10).forEach(([date, count]) => {
      console.log(`  ${date}: ${count} items`);
    });
    
    // Check if there are items with different hypothesisId
    const otherHypothesis = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: { $ne: testHypothesisId }
    }).countDocuments();
    
    if (otherHypothesis > 0) {
      console.log(`\n⚠️  Found ${otherHypothesis} items with different hypothesisId in the same project`);
    }
    
    await mongoose.disconnect();
    console.log("\n✅ Check complete");
  } catch (error) {
    console.error("❌ Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkBacklogQueryDirect();

