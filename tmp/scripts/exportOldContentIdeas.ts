import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { writeFileSync } from "fs";
import { join } from "path";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

async function exportOldContentIdeas() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all content items
    const allItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      status: { $ne: "archived" }
    }).sort({ createdAt: 1 }).exec();

    console.log(`\n📊 Found ${allItems.length} total content items`);

    // Define cutoff date - items created before December 9, 2025 are considered "old"
    const cutoffDate = new Date("2025-12-09T00:00:00.000Z");
    
    // Separate old and new items
    const oldItems = allItems.filter(item => item.createdAt < cutoffDate);
    const newItems = allItems.filter(item => item.createdAt >= cutoffDate);

    console.log(`\n📅 Items created before 2025-12-09 (old): ${oldItems.length}`);
    console.log(`📅 Items created on/after 2025-12-09 (new): ${newItems.length}`);

    if (oldItems.length === 0) {
      console.log("\n⚠️ No old items found (created before 2025-12-09)");
      console.log("All items were created on or after December 9, 2025");
      
      // Still export all items as "old" if user wants to save what was in cache
      console.log("\n💡 Exporting all items as they might have been in cache...");
    }

    // Prepare old items data for export
    const oldItemsData = {
      exportDate: new Date().toISOString(),
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      description: "Old content ideas that were likely in browser cache (created before 2025-12-09)",
      cutoffDate: cutoffDate.toISOString(),
      totalOldItems: oldItems.length,
      totalNewItems: newItems.length,
      oldItems: oldItems.map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.outline || "",
        category: item.category,
        format: item.format,
        status: item.status,
        backlogIdeaId: item.backlogIdeaId?.toString() || null,
        content: item.content || "",
        imageUrl: item.imageUrl || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        createdBy: item.createdBy || "system",
        updatedBy: item.updatedBy || "system"
      })),
      // Also include all items if no old items found (they might have been in cache)
      allItems: oldItems.length === 0 ? allItems.map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.outline || "",
        category: item.category,
        format: item.format,
        status: item.status,
        backlogIdeaId: item.backlogIdeaId?.toString() || null,
        content: item.content || "",
        imageUrl: item.imageUrl || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        createdBy: item.createdBy || "system",
        updatedBy: item.updatedBy || "system"
      })) : []
    };

    // Group old items by date
    const oldByDate = oldItems.reduce((acc, item) => {
      const date = item.createdAt.toISOString().substring(0, 10);
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        id: item._id.toString(),
        title: item.title,
        category: item.category,
        status: item.status,
        backlogIdeaId: item.backlogIdeaId?.toString() || null
      });
      return acc;
    }, {} as Record<string, any[]>);

    oldItemsData.byDate = oldByDate;

    // Statistics for old items
    const oldStats = {
      byStatus: oldItems.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: oldItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      withBacklogIdeaId: oldItems.filter(item => item.backlogIdeaId).length,
      withoutBacklogIdeaId: oldItems.filter(item => !item.backlogIdeaId).length,
      byLanguage: {
        russian: oldItems.filter(item => /[а-яё]/i.test(item.title || "")).length,
        english: oldItems.filter(item => !/[а-яё]/i.test(item.title || "")).length
      }
    };

    oldItemsData.statistics = oldStats;

    // Save to JSON file
    const logsDir = join(process.cwd(), "..", "logs");
    const outputPath = join(logsDir, `old-content-ideas-export-${Date.now()}.json`);
    writeFileSync(outputPath, JSON.stringify(oldItemsData, null, 2), "utf-8");
    console.log(`\n✅ Exported ${oldItems.length || allItems.length} old items to: ${outputPath}`);

    // Also save a human-readable summary
    const summaryPath = join(logsDir, `old-content-ideas-summary-${Date.now()}.txt`);
    let summary = `Old Content Ideas Export Summary\n`;
    summary += `===================================\n\n`;
    summary += `Export Date: ${oldItemsData.exportDate}\n`;
    summary += `Project ID: ${testProjectId}\n`;
    summary += `Hypothesis ID: ${testHypothesisId}\n`;
    summary += `Cutoff Date: ${cutoffDate.toISOString()}\n`;
    summary += `Total Old Items: ${oldItems.length}\n`;
    summary += `Total New Items: ${newItems.length}\n\n`;

    if (oldItems.length > 0) {
      summary += `Statistics for Old Items:\n`;
      summary += `- By Status: ${JSON.stringify(oldStats.byStatus, null, 2)}\n`;
      summary += `- By Category: ${JSON.stringify(oldStats.byCategory, null, 2)}\n`;
      summary += `- With BacklogIdeaId: ${oldStats.withBacklogIdeaId}\n`;
      summary += `- Without BacklogIdeaId: ${oldStats.withoutBacklogIdeaId}\n`;
      summary += `- By Language: Russian: ${oldStats.byLanguage.russian}, English: ${oldStats.byLanguage.english}\n\n`;

      summary += `Old Items by Date:\n`;
      Object.entries(oldByDate).forEach(([date, items]) => {
        summary += `\n${date} (${items.length} items):\n`;
        items.forEach(item => {
          summary += `  - [${item.category}] ${item.title} (status: ${item.status}, backlogId: ${item.backlogIdeaId || 'none'})\n`;
        });
      });

      summary += `\n\nAll Old Items (Full List):\n`;
      summary += `==========================\n\n`;
      oldItems.forEach((item, index) => {
        summary += `${index + 1}. ${item.title}\n`;
        summary += `   Category: ${item.category}\n`;
        summary += `   Format: ${item.format}\n`;
        summary += `   Status: ${item.status}\n`;
        summary += `   BacklogIdeaId: ${item.backlogIdeaId?.toString() || 'none'}\n`;
        summary += `   Created: ${item.createdAt.toISOString()}\n`;
        if (item.outline) {
          summary += `   Description: ${item.outline.substring(0, 100)}${item.outline.length > 100 ? '...' : ''}\n`;
        }
        summary += `\n`;
      });
    } else {
      summary += `⚠️ No items found created before ${cutoffDate.toISOString()}\n\n`;
      summary += `All items in database (might have been in cache):\n`;
      summary += `==================================================\n\n`;
      allItems.forEach((item, index) => {
        summary += `${index + 1}. ${item.title}\n`;
        summary += `   Category: ${item.category}\n`;
        summary += `   Format: ${item.format}\n`;
        summary += `   Status: ${item.status}\n`;
        summary += `   BacklogIdeaId: ${item.backlogIdeaId?.toString() || 'none'}\n`;
        summary += `   Created: ${item.createdAt.toISOString()}\n`;
        if (item.outline) {
          summary += `   Description: ${item.outline.substring(0, 100)}${item.outline.length > 100 ? '...' : ''}\n`;
        }
        summary += `\n`;
      });
    }

    writeFileSync(summaryPath, summary, "utf-8");
    console.log(`✅ Exported summary to: ${summaryPath}`);

    console.log(`\n📊 Export Summary:`);
    console.log(`  Old items (before 2025-12-09): ${oldItems.length}`);
    console.log(`  New items (on/after 2025-12-09): ${newItems.length}`);
    if (oldItems.length > 0) {
      console.log(`  Old items by status:`, oldStats.byStatus);
      console.log(`  Old items by category:`, oldStats.byCategory);
    }

    await mongoose.disconnect();
    console.log("\n✅ Export complete");
  } catch (error) {
    console.error("❌ Error exporting old content ideas:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportOldContentIdeas();


