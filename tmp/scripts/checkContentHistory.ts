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

async function checkContentHistory() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all content items sorted by creation date
    const allContentItems = await SeoContentItem.find({
      projectId: testProjectId
    }).sort({ createdAt: 1 }).exec();

    console.log(`\n📊 Total content items: ${allContentItems.length}`);
    console.log(`📅 Date range: ${allContentItems[0]?.createdAt} to ${allContentItems[allContentItems.length - 1]?.createdAt}`);

    // Group by creation date
    const byDate = allContentItems.reduce((acc, item) => {
      const date = new Date(item.createdAt);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    }, {} as Record<string, typeof allContentItems>);

    console.log(`\n📆 Content items by creation date:`);
    Object.entries(byDate).forEach(([date, items]) => {
      console.log(`  ${date}: ${items.length} items`);
    });

    // Check backlog items created today (when restoration script ran)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      createdAt: { $gte: today }
    }).exec();

    console.log(`\n📋 Backlog items created today (restoration): ${todayBacklogItems.length}`);

    // Check content items that were linked to backlog today
    const contentItemsLinkedToday = allContentItems.filter(item => {
      if (!item.backlogIdeaId) return false;
      // Check if backlog item was created today
      const backlogItem = todayBacklogItems.find(b => b._id.toString() === item.backlogIdeaId);
      return !!backlogItem;
    });

    console.log(`\n🔗 Content items linked to backlog today: ${contentItemsLinkedToday.length}`);

    // Check if there are content items that might have been from other hypotheses
    // Look for items created BEFORE today but linked to backlog items created today
    const suspiciousItems = allContentItems.filter(item => {
      if (!item.backlogIdeaId) return false;
      const itemDate = new Date(item.createdAt);
      itemDate.setHours(0, 0, 0, 0);
      
      // If content item was created before today but backlog item was created today
      if (itemDate < today) {
        const backlogItem = todayBacklogItems.find(b => b._id.toString() === item.backlogIdeaId);
        return !!backlogItem;
      }
      return false;
    });

    console.log(`\n⚠️ Suspicious items (created before today, linked to backlog created today): ${suspiciousItems.length}`);
    if (suspiciousItems.length > 0) {
      console.log(`  These items might have been from other hypotheses:`);
      suspiciousItems.slice(0, 10).forEach(item => {
        console.log(`    - ${item.title} (created: ${item.createdAt}, category: ${item.category})`);
      });
    }

    // Check all backlog items and their hypothesisIds
    const allBacklogItems = await SeoBacklogIdea.find({
      projectId: testProjectId
    }).exec();

    const backlogByHypothesis = allBacklogItems.reduce((acc, item) => {
      const hypId = item.hypothesisId || "null/empty";
      if (!acc[hypId]) acc[hypId] = [];
      acc[hypId].push(item);
      return acc;
    }, {} as Record<string, typeof allBacklogItems>);

    console.log(`\n📋 Backlog items by hypothesis:`);
    Object.entries(backlogByHypothesis).forEach(([hypId, items]) => {
      const createdToday = items.filter(item => {
        const date = new Date(item.createdAt);
        date.setHours(0, 0, 0, 0);
        return date >= today;
      });
      console.log(`  Hypothesis ${hypId}: ${items.length} total, ${createdToday.length} created today`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Analysis complete");
  } catch (error) {
    console.error("❌ Error analyzing:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkContentHistory();


