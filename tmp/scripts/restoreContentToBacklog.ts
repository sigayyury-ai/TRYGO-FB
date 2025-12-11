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

async function restoreContentToBacklog() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all content items without backlogIdeaId
    const contentItemsWithoutBacklog = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      backlogIdeaId: { $exists: false }
    }).exec();

    console.log(`\n📋 Found ${contentItemsWithoutBacklog.length} content items without backlogIdeaId`);

    // Get all existing backlog items
    const existingBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    }).exec();

    console.log(`📝 Found ${existingBacklogItems.length} existing backlog items`);

    let matchedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    // Step 1: Try to match existing content items with existing backlog items
    console.log(`\n🔗 Step 1: Matching content items with existing backlog items...`);
    
    for (const contentItem of contentItemsWithoutBacklog) {
      // Try to find matching backlog item by title
      const matchingBacklog = existingBacklogItems.find(backlog => {
        const backlogTitle = backlog.title?.trim().toLowerCase();
        const contentTitle = contentItem.title?.trim().toLowerCase();
        return backlogTitle === contentTitle;
      });

      if (matchingBacklog) {
        // Update content item with backlogIdeaId
        await SeoContentItem.findByIdAndUpdate(contentItem._id, {
          backlogIdeaId: matchingBacklog._id.toString()
        }).exec();
        
        matchedCount++;
        console.log(`  ✅ Matched: "${contentItem.title}" -> backlogId: ${matchingBacklog._id}`);
      }
    }

    console.log(`\n✅ Matched ${matchedCount} content items with existing backlog items`);

    // Step 2: Create backlog items for remaining content items
    console.log(`\n📝 Step 2: Creating backlog items for remaining content items...`);
    
    // Get updated list of content items without backlogIdeaId
    const remainingContentItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      backlogIdeaId: { $exists: false }
    }).exec();

    console.log(`  Remaining items to process: ${remainingContentItems.length}`);

    for (const contentItem of remainingContentItems) {
      // Check if backlog item with same title already exists (in case of duplicates)
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
        
        updatedCount++;
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

    // Step 3: Ensure published items are preserved
    console.log(`\n📰 Step 3: Checking published items...`);
    const publishedItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      status: "published"
    }).exec();

    console.log(`  Found ${publishedItems.length} published items`);
    
    for (const publishedItem of publishedItems) {
      if (!publishedItem.backlogIdeaId) {
        console.log(`  ⚠️ Published item without backlogIdeaId: "${publishedItem.title}"`);
        
        // Try to find or create backlog item
        let backlogItem = await SeoBacklogIdea.findOne({
          projectId: testProjectId,
          hypothesisId: testHypothesisId,
          title: publishedItem.title
        }).exec();

        if (!backlogItem) {
          backlogItem = await SeoBacklogIdea.create({
            projectId: testProjectId,
            hypothesisId: testHypothesisId,
            title: publishedItem.title,
            description: publishedItem.outline || publishedItem.title,
            status: "published", // Mark as published in backlog too
            category: publishedItem.category,
            createdBy: publishedItem.createdBy || "system",
            updatedBy: publishedItem.updatedBy || "system"
          });
          console.log(`    ✅ Created backlog item for published content`);
        }

        // Link published item to backlog
        await SeoContentItem.findByIdAndUpdate(publishedItem._id, {
          backlogIdeaId: backlogItem._id.toString()
        }).exec();
        
        console.log(`    ✅ Linked published item to backlog`);
      } else {
        console.log(`  ✅ Published item already linked: "${publishedItem.title}"`);
      }
    }

    // Final summary
    console.log(`\n📊 Summary:`);
    console.log(`  Matched with existing backlog: ${matchedCount}`);
    console.log(`  Created new backlog items: ${createdCount}`);
    console.log(`  Linked to existing backlog: ${updatedCount}`);
    console.log(`  Total processed: ${matchedCount + createdCount + updatedCount}`);

    // Verify results
    const finalContentItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    }).exec();

    const withBacklog = finalContentItems.filter(item => item.backlogIdeaId);
    const withoutBacklog = finalContentItems.filter(item => !item.backlogIdeaId);

    console.log(`\n✅ Final verification:`);
    console.log(`  Total content items: ${finalContentItems.length}`);
    console.log(`  With backlogIdeaId: ${withBacklog.length}`);
    console.log(`  Without backlogIdeaId: ${withoutBacklog.length}`);

    if (withoutBacklog.length > 0) {
      console.log(`  ⚠️ Still ${withoutBacklog.length} items without backlogIdeaId:`);
      withoutBacklog.slice(0, 5).forEach(item => {
        console.log(`    - ${item.title}`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Restoration complete");
  } catch (error) {
    console.error("❌ Error restoring content to backlog:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ask for confirmation before running
console.log("⚠️  This script will:");
console.log("  1. Match content items with existing backlog items");
console.log("  2. Create backlog items for content items without them");
console.log("  3. Ensure published items are linked to backlog");
console.log("\nPress Ctrl+C to cancel, or wait 3 seconds to continue...");

setTimeout(() => {
  restoreContentToBacklog();
}, 3000);


