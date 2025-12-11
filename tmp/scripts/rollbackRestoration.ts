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

async function rollbackRestoration() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find backlog items created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      createdAt: { $gte: today }
    }).exec();

    console.log(`\n📋 Found ${todayBacklogItems.length} backlog items created today`);

    // Find content items that were created BEFORE today but linked to backlog items created today
    const allContentItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    }).exec();

    const itemsToRollback = allContentItems.filter(item => {
      if (!item.backlogIdeaId) return false;
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);
      
      if (itemDate < today) {
        const backlogItem = todayBacklogItems.find(b => b._id.toString() === item.backlogIdeaId);
        return !!backlogItem;
      }
      return false;
    });

    console.log(`\n⚠️ Found ${itemsToRollback.length} items to rollback (created before today, linked to backlog created today)`);

    if (itemsToRollback.length === 0) {
      console.log("No items to rollback.");
      await mongoose.disconnect();
      return;
    }

    console.log(`\n📋 Sample items to rollback:`);
    itemsToRollback.slice(0, 10).forEach(item => {
      console.log(`  - ${item.title} (created: ${item.createdAt})`);
    });

    console.log(`\n⚠️  This will:`);
    console.log(`  1. Remove backlogIdeaId from ${itemsToRollback.length} content items`);
    console.log(`  2. Delete ${todayBacklogItems.length} backlog items created today`);
    console.log(`\nPress Ctrl+C to cancel, or wait 5 seconds to continue...`);

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 1: Remove backlogIdeaId from content items
    console.log(`\n🔄 Step 1: Removing backlogIdeaId from content items...`);
    let updatedCount = 0;
    for (const item of itemsToRollback) {
      await SeoContentItem.findByIdAndUpdate(item._id, {
        $unset: { backlogIdeaId: "" }
      }).exec();
      updatedCount++;
      if (updatedCount % 10 === 0) {
        console.log(`  Updated ${updatedCount}/${itemsToRollback.length} items...`);
      }
    }
    console.log(`  ✅ Removed backlogIdeaId from ${updatedCount} content items`);

    // Step 2: Delete backlog items created today
    console.log(`\n🔄 Step 2: Deleting backlog items created today...`);
    const deleteResult = await SeoBacklogIdea.deleteMany({
      _id: { $in: todayBacklogItems.map(b => b._id) }
    }).exec();
    console.log(`  ✅ Deleted ${deleteResult.deletedCount} backlog items`);

    // Verify
    const remainingContentItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      backlogIdeaId: { $exists: false }
    }).exec();

    console.log(`\n✅ Rollback complete!`);
    console.log(`  Content items without backlogIdeaId: ${remainingContentItems.length}`);
    console.log(`  These items are now back to their original state (before restoration)`);

    await mongoose.disconnect();
    console.log("\n✅ Rollback complete");
  } catch (error) {
    console.error("❌ Error rolling back:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

rollbackRestoration();


