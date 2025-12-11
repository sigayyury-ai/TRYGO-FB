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

async function exportContentIdeas() {
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

    console.log(`\n📊 Found ${allItems.length} content items`);

    // Prepare data for export
    const exportData = {
      exportDate: new Date().toISOString(),
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      totalItems: allItems.length,
      items: allItems.map(item => ({
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
      }))
    };

    // Group by date for easier reading
    const byDate = allItems.reduce((acc, item) => {
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

    exportData.byDate = byDate;

    // Statistics
    const stats = {
      byStatus: allItems.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: allItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      withBacklogIdeaId: allItems.filter(item => item.backlogIdeaId).length,
      withoutBacklogIdeaId: allItems.filter(item => !item.backlogIdeaId).length,
      byLanguage: {
        russian: allItems.filter(item => /[а-яё]/i.test(item.title || "")).length,
        english: allItems.filter(item => !/[а-яё]/i.test(item.title || "")).length
      }
    };

    exportData.statistics = stats;

    // Save to JSON file (use parent directory for logs)
    const logsDir = join(process.cwd(), "..", "logs");
    const outputPath = join(logsDir, `content-ideas-export-${Date.now()}.json`);
    writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");
    console.log(`\n✅ Exported ${allItems.length} items to: ${outputPath}`);

    // Also save a human-readable summary
    const summaryPath = join(logsDir, `content-ideas-summary-${Date.now()}.txt`);
    let summary = `Content Ideas Export Summary\n`;
    summary += `============================\n\n`;
    summary += `Export Date: ${exportData.exportDate}\n`;
    summary += `Project ID: ${testProjectId}\n`;
    summary += `Hypothesis ID: ${testHypothesisId}\n`;
    summary += `Total Items: ${allItems.length}\n\n`;

    summary += `Statistics:\n`;
    summary += `- By Status: ${JSON.stringify(stats.byStatus, null, 2)}\n`;
    summary += `- By Category: ${JSON.stringify(stats.byCategory, null, 2)}\n`;
    summary += `- With BacklogIdeaId: ${stats.withBacklogIdeaId}\n`;
    summary += `- Without BacklogIdeaId: ${stats.withoutBacklogIdeaId}\n`;
    summary += `- By Language: Russian: ${stats.byLanguage.russian}, English: ${stats.byLanguage.english}\n\n`;

    summary += `Items by Date:\n`;
    Object.entries(byDate).forEach(([date, items]) => {
      summary += `\n${date} (${items.length} items):\n`;
      items.forEach(item => {
        summary += `  - [${item.category}] ${item.title} (status: ${item.status}, backlogId: ${item.backlogIdeaId || 'none'})\n`;
      });
    });

    summary += `\n\nAll Items (Full List):\n`;
    summary += `=====================\n\n`;
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

    writeFileSync(summaryPath, summary, "utf-8");
    console.log(`✅ Exported summary to: ${summaryPath}`);

    console.log(`\n📊 Export Summary:`);
    console.log(`  Total items: ${allItems.length}`);
    console.log(`  By status:`, stats.byStatus);
    console.log(`  By category:`, stats.byCategory);
    console.log(`  With backlogIdeaId: ${stats.withBacklogIdeaId}`);
    console.log(`  Without backlogIdeaId: ${stats.withoutBacklogIdeaId}`);

    await mongoose.disconnect();
    console.log("\n✅ Export complete");
  } catch (error) {
    console.error("❌ Error exporting content ideas:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportContentIdeas();

