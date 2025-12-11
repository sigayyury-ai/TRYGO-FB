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
const testHypothesisId = "687fe5363c4cca83a3cc578d";

async function restoreCorrectHypothesisIds() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all hypotheses in the project
    const db = mongoose.connection.db;
    const hypotheses = await db.collection("hypotheses").find({ projectId: testProjectId }).toArray();
    
    console.log(`\n🧪 Found ${hypotheses.length} hypotheses in project:`);
    hypotheses.forEach((hyp: any) => {
      console.log(`  - ${hyp._id}: ${hyp.title || hyp.name || "Untitled"}`);
    });

    if (hypotheses.length === 0) {
      console.log("\n⚠️ No hypotheses found. Cannot determine correct hypothesisId.");
      console.log("Please provide the correct hypothesisId for the materials that were lost.");
      await mongoose.disconnect();
      return;
    }

    // Find content items that were created yesterday but linked to backlog items created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      createdAt: { $gte: today }
    }).exec();

    const allContentItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    }).exec();

    // Find items that might have been from other hypotheses
    const suspiciousItems = allContentItems.filter(item => {
      if (!item.backlogIdeaId) return false;
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);
      
      if (itemDate < today) {
        const backlogItem = todayBacklogItems.find(b => b._id.toString() === item.backlogIdeaId);
        return !!backlogItem;
      }
      return false;
    });

    console.log(`\n⚠️ Found ${suspiciousItems.length} items that might have been from other hypotheses`);
    
    if (suspiciousItems.length === 0) {
      console.log("No suspicious items found. All items seem to be correctly assigned.");
      await mongoose.disconnect();
      return;
    }

    // Ask user which hypothesis these items should belong to
    console.log(`\n📋 These items were created before today but linked to backlog items created today:`);
    console.log(`They might have been created for a different hypothesis.`);
    console.log(`\nPlease provide the correct hypothesisId for these items.`);
    console.log(`Available hypotheses:`);
    hypotheses.forEach((hyp: any, index: number) => {
      console.log(`  ${index + 1}. ${hyp._id}: ${hyp.title || hyp.name || "Untitled"}`);
    });

    // For now, we'll create a script that can be run with a hypothesisId parameter
    console.log(`\n💡 To restore these items to a different hypothesis, run:`);
    console.log(`   npx tsx scripts/restoreCorrectHypothesisIds.ts <hypothesisId>`);
    console.log(`\n⚠️ WARNING: This will:`);
    console.log(`   1. Update content items' hypothesisId`);
    console.log(`   2. Update backlog items' hypothesisId`);
    console.log(`   3. Re-link content items to backlog items`);

    await mongoose.disconnect();
    console.log("\n✅ Analysis complete");
  } catch (error) {
    console.error("❌ Error analyzing:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get hypothesisId from command line argument
const targetHypothesisId = process.argv[2];

if (targetHypothesisId) {
  // Restore items to the specified hypothesis
  restoreCorrectHypothesisIds().then(() => {
    console.log(`\n🔄 To actually restore items, implement the restoration logic with hypothesisId: ${targetHypothesisId}`);
  });
} else {
  restoreCorrectHypothesisIds();
}


