import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";

async function checkAllHypothesesInProject() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all unique hypothesisIds from content items
    const allContentItems = await SeoContentItem.find({
      projectId: testProjectId
    }).exec();

    const uniqueHypothesisIds = new Set<string>();
    allContentItems.forEach(item => {
      if (item.hypothesisId) {
        uniqueHypothesisIds.add(item.hypothesisId);
      }
    });

    console.log(`\n🧪 Unique hypothesisIds in content items: ${uniqueHypothesisIds.size}`);
    uniqueHypothesisIds.forEach(hypId => {
      const count = allContentItems.filter(item => item.hypothesisId === hypId).length;
      console.log(`  - ${hypId}: ${count} items`);
    });

    // Get all unique hypothesisIds from backlog items
    const allBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId
    }).exec();

    const uniqueBacklogHypothesisIds = new Set<string>();
    allBacklogItems.forEach(item => {
      if (item.hypothesisId) {
        uniqueBacklogHypothesisIds.add(item.hypothesisId);
      }
    });

    console.log(`\n📋 Unique hypothesisIds in backlog items: ${uniqueBacklogHypothesisIds.size}`);
    uniqueBacklogHypothesisIds.forEach(hypId => {
      const count = allBacklogItems.filter(item => item.hypothesisId === hypId).length;
      console.log(`  - ${hypId}: ${count} items`);
    });

    // Check if there are hypothesisIds in backlog that are NOT in content
    const backlogOnlyHypIds = Array.from(uniqueBacklogHypothesisIds).filter(
      hypId => !uniqueHypothesisIds.has(hypId)
    );

    if (backlogOnlyHypIds.length > 0) {
      console.log(`\n⚠️ HypothesisIds in backlog but NOT in content (might be lost):`);
      backlogOnlyHypIds.forEach(hypId => {
        const backlogCount = allBacklogItems.filter(item => item.hypothesisId === hypId).length;
        console.log(`  - ${hypId}: ${backlogCount} backlog items`);
      });
    }

    // Check if there are hypothesisIds in content that are NOT in backlog
    const contentOnlyHypIds = Array.from(uniqueHypothesisIds).filter(
      hypId => !uniqueBacklogHypothesisIds.has(hypId)
    );

    if (contentOnlyHypIds.length > 0) {
      console.log(`\n⚠️ HypothesisIds in content but NOT in backlog:`);
      contentOnlyHypIds.forEach(hypId => {
        const contentCount = allContentItems.filter(item => item.hypothesisId === hypId).length;
        console.log(`  - ${hypId}: ${contentCount} content items`);
      });
    }

    // Try to find hypotheses collection directly
    const db = mongoose.connection.db;
    const hypothesesCollection = db.collection("hypotheses");
    const allHypotheses = await hypothesesCollection.find({ projectId: testProjectId }).toArray();
    
    console.log(`\n🧪 All hypotheses in project (from hypotheses collection): ${allHypotheses.length}`);
    allHypotheses.forEach((hyp: any) => {
      const contentCount = allContentItems.filter(item => item.hypothesisId === hyp._id.toString()).length;
      const backlogCount = allBacklogItems.filter(item => item.hypothesisId === hyp._id.toString()).length;
      console.log(`  - ${hyp._id}: ${hyp.title || hyp.name || "Untitled"}`);
      console.log(`    Content items: ${contentCount}, Backlog items: ${backlogCount}`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Analysis complete");
  } catch (error) {
    console.error("❌ Error analyzing:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkAllHypothesesInProject();


