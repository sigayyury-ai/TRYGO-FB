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

async function exportContentIdeasOnly() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all content items (these are the article ideas)
    const allItems = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      status: { $ne: "archived" }
    }).sort({ createdAt: 1 }).exec();

    console.log(`\n📊 Found ${allItems.length} content ideas (article ideas)`);

    // Prepare data for export - only article ideas
    const exportData = {
      exportDate: new Date().toISOString(),
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      description: "Content Ideas (Article Ideas) - not clusters",
      totalIdeas: allItems.length,
      ideas: allItems.map(item => ({
        id: item._id.toString(),
        title: item.title,
        description: item.outline || "",
        category: item.category, // pain, goal, trigger, feature, benefit, faq, info
        format: item.format, // blog, commercial, faq
        status: item.status, // draft, review, ready, published
        backlogIdeaId: item.backlogIdeaId?.toString() || null,
        content: item.content || "", // Full article content if generated
        imageUrl: item.imageUrl || null,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        createdBy: item.createdBy || "system",
        updatedBy: item.updatedBy || "system"
      }))
    };

    // Group by category for easier reading
    const byCategory = allItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push({
        id: item._id.toString(),
        title: item.title,
        status: item.status,
        backlogIdeaId: item.backlogIdeaId?.toString() || null,
        createdAt: item.createdAt.toISOString()
      });
      return acc;
    }, {} as Record<string, any[]>);

    exportData.byCategory = byCategory;

    // Group by date
    const byDate = allItems.reduce((acc, item) => {
      const date = item.createdAt.toISOString().substring(0, 10);
      if (!acc[date]) acc[date] = [];
      acc[date].push({
        id: item._id.toString(),
        title: item.title,
        category: item.category,
        status: item.status
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
      byFormat: allItems.reduce((acc, item) => {
        acc[item.format] = (acc[item.format] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      withBacklogIdeaId: allItems.filter(item => item.backlogIdeaId).length,
      withoutBacklogIdeaId: allItems.filter(item => !item.backlogIdeaId).length,
      withContent: allItems.filter(item => item.content && item.content.length > 0).length,
      withImage: allItems.filter(item => item.imageUrl).length,
      byLanguage: {
        russian: allItems.filter(item => /[а-яё]/i.test(item.title || "")).length,
        english: allItems.filter(item => !/[а-яё]/i.test(item.title || "")).length
      }
    };

    exportData.statistics = stats;

    // Save to JSON file
    const logsDir = join(process.cwd(), "..", "logs");
    const outputPath = join(logsDir, `content-ideas-only-${Date.now()}.json`);
    writeFileSync(outputPath, JSON.stringify(exportData, null, 2), "utf-8");
    console.log(`\n✅ Exported ${allItems.length} article ideas to: ${outputPath}`);

    // Save a simple CSV for easy viewing
    const csvPath = join(logsDir, `content-ideas-only-${Date.now()}.csv`);
    let csv = "ID,Title,Category,Format,Status,BacklogIdeaId,Created,Description\n";
    allItems.forEach(item => {
      const title = (item.title || "").replace(/"/g, '""');
      const desc = (item.outline || "").replace(/"/g, '""').replace(/\n/g, " ");
      csv += `"${item._id}","${title}","${item.category}","${item.format}","${item.status}","${item.backlogIdeaId || ""}","${item.createdAt.toISOString()}","${desc}"\n`;
    });
    writeFileSync(csvPath, csv, "utf-8");
    console.log(`✅ Exported CSV to: ${csvPath}`);

    // Save a readable text file
    const txtPath = join(logsDir, `content-ideas-only-${Date.now()}.txt`);
    let txt = `Content Ideas (Article Ideas) Export\n`;
    txt += `=====================================\n\n`;
    txt += `Export Date: ${exportData.exportDate}\n`;
    txt += `Project ID: ${testProjectId}\n`;
    txt += `Hypothesis ID: ${testHypothesisId}\n`;
    txt += `Total Ideas: ${allItems.length}\n\n`;

    txt += `Statistics:\n`;
    txt += `- By Status: ${JSON.stringify(stats.byStatus, null, 2)}\n`;
    txt += `- By Category: ${JSON.stringify(stats.byCategory, null, 2)}\n`;
    txt += `- By Format: ${JSON.stringify(stats.byFormat, null, 2)}\n`;
    txt += `- With BacklogIdeaId: ${stats.withBacklogIdeaId}\n`;
    txt += `- Without BacklogIdeaId: ${stats.withoutBacklogIdeaId}\n`;
    txt += `- With Content: ${stats.withContent}\n`;
    txt += `- With Image: ${stats.withImage}\n`;
    txt += `- By Language: Russian: ${stats.byLanguage.russian}, English: ${stats.byLanguage.english}\n\n`;

    txt += `Ideas by Category:\n`;
    txt += `==================\n\n`;
    Object.entries(byCategory).forEach(([category, items]) => {
      txt += `\n${category.toUpperCase()} (${items.length} ideas):\n`;
      items.forEach(item => {
        txt += `  - ${item.title}\n`;
        txt += `    Status: ${item.status}, BacklogId: ${item.backlogIdeaId || 'none'}, Created: ${item.createdAt.substring(0, 10)}\n`;
      });
    });

    txt += `\n\nAll Ideas (Full List):\n`;
    txt += `=====================\n\n`;
    allItems.forEach((item, index) => {
      txt += `${index + 1}. ${item.title}\n`;
      txt += `   ID: ${item._id}\n`;
      txt += `   Category: ${item.category}\n`;
      txt += `   Format: ${item.format}\n`;
      txt += `   Status: ${item.status}\n`;
      txt += `   BacklogIdeaId: ${item.backlogIdeaId?.toString() || 'none'}\n`;
      txt += `   Created: ${item.createdAt.toISOString()}\n`;
      if (item.outline) {
        txt += `   Description: ${item.outline}\n`;
      }
      if (item.content) {
        txt += `   Has Content: Yes (${item.content.length} chars)\n`;
      }
      if (item.imageUrl) {
        txt += `   Has Image: Yes\n`;
      }
      txt += `\n`;
    });

    writeFileSync(txtPath, txt, "utf-8");
    console.log(`✅ Exported readable text to: ${txtPath}`);

    console.log(`\n📊 Export Summary:`);
    console.log(`  Total article ideas: ${allItems.length}`);
    console.log(`  By status:`, stats.byStatus);
    console.log(`  By category:`, stats.byCategory);
    console.log(`  With backlogIdeaId: ${stats.withBacklogIdeaId}`);
    console.log(`  With content: ${stats.withContent}`);
    console.log(`  With image: ${stats.withImage}`);

    await mongoose.disconnect();
    console.log("\n✅ Export complete");
  } catch (error) {
    console.error("❌ Error exporting content ideas:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportContentIdeasOnly();


