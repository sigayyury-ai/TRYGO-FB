import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

async function checkOrphanedContent() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB\n");

    // Get all content items with backlogIdeaId
    const contentItems = await SeoContentItem.find({ backlogIdeaId: { $exists: true, $ne: null } }).exec();
    console.log("=== Content Items with BacklogIdeaId ===");
    console.log(`Total: ${contentItems.length}\n`);

    if (contentItems.length > 0) {
      console.log("Checking for orphaned content items (backlog item deleted)...\n");
      
      let orphanedCount = 0;
      for (const contentItem of contentItems) {
        if (contentItem.backlogIdeaId) {
          const backlogItem = await SeoBacklogIdea.findById(contentItem.backlogIdeaId).exec();
          if (!backlogItem) {
            orphanedCount++;
            console.log(`\n⚠️  ORPHANED Content Item:`);
            console.log(`   Content ID: ${contentItem.id}`);
            console.log(`   Title: ${contentItem.title}`);
            console.log(`   BacklogIdeaId: ${contentItem.backlogIdeaId}`);
            console.log(`   Status: ${contentItem.status}`);
            console.log(`   ProjectId: ${contentItem.projectId}`);
            console.log(`   HypothesisId: ${contentItem.hypothesisId}`);
            console.log(`   Created: ${contentItem.createdAt}`);
          }
        }
      }

      if (orphanedCount === 0) {
        console.log("✅ No orphaned content items found. All backlog items exist.");
      } else {
        console.log(`\n⚠️  Found ${orphanedCount} orphaned content items (backlog items were deleted)`);
      }
    } else {
      console.log("No content items with backlogIdeaId found.");
    }

    // Check if there are any backlog items at all
    const allBacklogItems = await SeoBacklogIdea.find({}).exec();
    console.log("\n=== Total Backlog Items in Database ===");
    console.log(`Total: ${allBacklogItems.length}`);

    if (allBacklogItems.length === 0) {
      console.log("\n⚠️  WARNING: No backlog items found in database at all!");
      console.log("This could mean:");
      console.log("  1. All backlog items were deleted");
      console.log("  2. Data was never created");
      console.log("  3. Data is in a different collection");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkOrphanedContent();

