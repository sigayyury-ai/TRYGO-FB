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

async function updatePublishedBacklogStatus() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all published content items
    const publishedItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      status: "published"
    }).exec();

    console.log(`\n📰 Found ${publishedItems.length} published content items`);

    let updatedCount = 0;

    for (const contentItem of publishedItems) {
      if (contentItem.backlogIdeaId) {
        // Update backlog item status to "published"
        const backlogItem = await SeoBacklogIdea.findById(contentItem.backlogIdeaId).exec();
        
        if (backlogItem) {
          if (backlogItem.status !== "published") {
            await SeoBacklogIdea.findByIdAndUpdate(contentItem.backlogIdeaId, {
              status: "published"
            }).exec();
            
            updatedCount++;
            console.log(`  ✅ Updated backlog item "${backlogItem.title}" to published status`);
          } else {
            console.log(`  ✅ Backlog item "${backlogItem.title}" already has published status`);
          }
        } else {
          console.log(`  ⚠️ Backlog item not found for content: "${contentItem.title}"`);
        }
      } else {
        console.log(`  ⚠️ Published content item without backlogIdeaId: "${contentItem.title}"`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  Published content items: ${publishedItems.length}`);
    console.log(`  Updated backlog items: ${updatedCount}`);

    // Verify final state
    const publishedBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      status: "published"
    }).exec();

    console.log(`\n✅ Final verification:`);
    console.log(`  Backlog items with published status: ${publishedBacklogItems.length}`);
    
    if (publishedBacklogItems.length > 0) {
      console.log(`  Published backlog items:`);
      publishedBacklogItems.forEach(item => {
        console.log(`    - ${item.title}`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Update complete");
  } catch (error) {
    console.error("❌ Error updating published backlog status:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updatePublishedBacklogStatus();


