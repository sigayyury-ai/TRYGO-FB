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

async function checkBacklogStatuses() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all backlog items
    const allItems = await SeoBacklogIdea.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId
    }).sort({ createdAt: 1 }).exec();

    console.log(`\n📊 Found ${allItems.length} backlog items`);

    // Group by status
    const byStatus = allItems.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push({
        id: item._id.toString(),
        title: item.title,
        createdAt: item.createdAt.toISOString()
      });
      return acc;
    }, {} as Record<string, any[]>);

    console.log("\n📊 Backlog items by status:");
    Object.entries(byStatus).forEach(([status, items]) => {
      console.log(`\n  ${status.toUpperCase()}: ${items.length} items`);
      if (items.length <= 5) {
        items.forEach(item => {
          console.log(`    - ${item.title.substring(0, 60)}...`);
        });
      } else {
        items.slice(0, 3).forEach(item => {
          console.log(`    - ${item.title.substring(0, 60)}...`);
        });
        console.log(`    ... and ${items.length - 3} more`);
      }
    });

    // Status mapping explanation
    console.log("\n📋 Status Mapping (Backend -> Frontend):");
    console.log("  'backlog' -> 'PENDING'");
    console.log("  'pending' -> 'PENDING'");
    console.log("  'scheduled' -> 'SCHEDULED'");
    console.log("  'in_progress' -> 'IN_PROGRESS'");
    console.log("  'completed' -> 'COMPLETED'");
    console.log("  'archived' -> 'ARCHIVED'");
    console.log("  'published' -> 'PUBLISHED'");

    console.log("\n⚠️  Frontend BacklogPanel filters:");
    console.log("  Only shows items with status === 'PENDING'");
    console.log("  Items with other statuses will NOT be displayed!");

    // Count items that would be shown vs hidden
    const pendingCount = allItems.filter(item => 
      item.status === "pending" || item.status === "backlog"
    ).length;
    const hiddenCount = allItems.length - pendingCount;

    console.log(`\n📊 Visibility Summary:`);
    console.log(`  ✅ Would be shown (pending/backlog): ${pendingCount}`);
    console.log(`  ❌ Would be hidden (other statuses): ${hiddenCount}`);
    console.log(`  Total: ${allItems.length}`);

    // Show examples of hidden items
    const hiddenItems = allItems.filter(item => 
      item.status !== "pending" && item.status !== "backlog"
    );
    if (hiddenItems.length > 0) {
      console.log(`\n🔍 Examples of hidden items:`);
      hiddenItems.slice(0, 5).forEach(item => {
        console.log(`  - [${item.status}] ${item.title.substring(0, 60)}...`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Check complete");
  } catch (error) {
    console.error("❌ Error checking backlog statuses:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkBacklogStatuses();

