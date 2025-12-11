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

async function checkRecentContent() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find content items created in the last 6 hours
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);
    
    const recentContentItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      createdAt: { $gte: sixHoursAgo }
    }).sort({ createdAt: -1 }).exec();

    console.log(`\n📊 Found ${recentContentItems.length} content items created in the last 6 hours`);

    if (recentContentItems.length > 0) {
      const withBacklog = recentContentItems.filter(item => item.backlogIdeaId);
      const withoutBacklog = recentContentItems.filter(item => !item.backlogIdeaId);
      
      console.log(`  With backlogIdeaId: ${withBacklog.length}`);
      console.log(`  Without backlogIdeaId: ${withoutBacklog.length}`);
      
      if (withoutBacklog.length > 0) {
        console.log(`\n  Items without backlogIdeaId:`);
        withoutBacklog.forEach(item => {
          console.log(`    - ${item.title} (created: ${item.createdAt}, category: ${item.category})`);
        });
      }
      
      if (withBacklog.length > 0) {
        console.log(`\n  Items with backlogIdeaId:`);
        withBacklog.slice(0, 5).forEach(item => {
          console.log(`    - ${item.title} (created: ${item.createdAt})`);
        });
      }
    }

    // Also check all items without backlogIdeaId
    const allItemsWithoutBacklog = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      backlogIdeaId: { $exists: false }
    }).sort({ createdAt: -1 }).exec();

    console.log(`\n📋 All items without backlogIdeaId: ${allItemsWithoutBacklog.length}`);
    
    if (allItemsWithoutBacklog.length > 0) {
      // Group by creation date
      const byDate = allItemsWithoutBacklog.reduce((acc, item) => {
        const date = new Date(item.createdAt);
        const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(item);
        return acc;
      }, {} as Record<string, typeof allItemsWithoutBacklog>);

      console.log(`\n  By creation time:`);
      Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 10)
        .forEach(([date, items]) => {
          console.log(`    ${date}: ${items.length} items`);
        });
    }

    await mongoose.disconnect();
    console.log("\n✅ Analysis complete");
  } catch (error) {
    console.error("❌ Error analyzing:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkRecentContent();


