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

async function restoreTodayContent() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find content items created in the last 6 hours (recent items that need restoration)
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    
    const todayContentItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      createdAt: { $gte: sixHoursAgo }
    }).exec();

    console.log(`\n📊 Found ${todayContentItems.length} content items created today`);

    if (todayContentItems.length === 0) {
      console.log("No items created today found.");
      await mongoose.disconnect();
      return;
    }

    // Check which ones don't have backlogIdeaId
    const itemsWithoutBacklog = todayContentItems.filter(item => !item.backlogIdeaId);
    console.log(`  Items without backlogIdeaId: ${itemsWithoutBacklog.length}`);

    if (itemsWithoutBacklog.length === 0) {
      console.log("All today's items already have backlogIdeaId.");
      await mongoose.disconnect();
      return;
    }

    // Get existing backlog items for this project/hypothesis
    const existingBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    }).exec();

    console.log(`\n📝 Found ${existingBacklogItems.length} existing backlog items`);

    let matchedCount = 0;
    let createdCount = 0;

    // Step 1: Try to match with existing backlog items
    console.log(`\n🔗 Step 1: Matching with existing backlog items...`);
    
    for (const contentItem of itemsWithoutBacklog) {
      const matchingBacklog = existingBacklogItems.find(backlog => {
        const backlogTitle = backlog.title?.trim().toLowerCase();
        const contentTitle = contentItem.title?.trim().toLowerCase();
        return backlogTitle === contentTitle;
      });

      if (matchingBacklog) {
        await SeoContentItem.findByIdAndUpdate(contentItem._id, {
          backlogIdeaId: matchingBacklog._id.toString()
        }).exec();
        
        matchedCount++;
        console.log(`  ✅ Matched: "${contentItem.title}" -> backlogId: ${matchingBacklog._id}`);
      }
    }

    console.log(`\n✅ Matched ${matchedCount} items with existing backlog items`);

    // Step 2: Create backlog items for remaining content items
    console.log(`\n📝 Step 2: Creating backlog items for remaining content items...`);
    
    const remainingItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      createdAt: { $gte: sixHoursAgo },
      backlogIdeaId: { $exists: false }
    }).exec();

    console.log(`  Remaining items to process: ${remainingItems.length}`);

    for (const contentItem of remainingItems) {
      // Check if backlog item with same title already exists
      const existingBacklog = await SeoBacklogIdea.findOne({
        projectId: testProjectId,
        hypothesisId: testHypothesisId,
        title: contentItem.title
      }).exec();

      if (existingBacklog) {
        // Link to existing backlog item
        await SeoContentItem.findByIdAndUpdate(contentItem._id, {
          backlogIdeaId: existingBacklog._id.toString()
        }).exec();
        
        console.log(`  ✅ Linked to existing backlog: "${contentItem.title}"`);
      } else {
        // Create new backlog item
        const newBacklogItem = await SeoBacklogIdea.create({
          projectId: testProjectId,
          hypothesisId: testHypothesisId,
          title: contentItem.title,
          description: contentItem.outline || contentItem.title,
          status: "pending",
          category: contentItem.category,
          createdBy: contentItem.createdBy || "system",
          updatedBy: contentItem.updatedBy || "system"
        });

        // Link content item to new backlog item
        await SeoContentItem.findByIdAndUpdate(contentItem._id, {
          backlogIdeaId: newBacklogItem._id.toString()
        }).exec();

        createdCount++;
        console.log(`  ✅ Created backlog item: "${contentItem.title}" (id: ${newBacklogItem._id})`);
      }
    }

    // Final verification
    const finalTodayItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      createdAt: { $gte: sixHoursAgo }
    }).exec();

    const withBacklog = finalTodayItems.filter(item => item.backlogIdeaId);
    const withoutBacklog = finalTodayItems.filter(item => !item.backlogIdeaId);

    console.log(`\n📊 Summary:`);
    console.log(`  Matched with existing backlog: ${matchedCount}`);
    console.log(`  Created new backlog items: ${createdCount}`);
    console.log(`  Total processed: ${matchedCount + createdCount}`);

    console.log(`\n✅ Final verification:`);
    console.log(`  Today's content items: ${finalTodayItems.length}`);
    console.log(`  With backlogIdeaId: ${withBacklog.length}`);
    console.log(`  Without backlogIdeaId: ${withoutBacklog.length}`);

    if (withoutBacklog.length > 0) {
      console.log(`  ⚠️ Still ${withoutBacklog.length} items without backlogIdeaId:`);
      withoutBacklog.forEach(item => {
        console.log(`    - ${item.title}`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Restoration complete");
  } catch (error) {
    console.error("❌ Error restoring content:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

restoreTodayContent();

