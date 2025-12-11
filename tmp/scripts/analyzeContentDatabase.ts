import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables");
  process.exit(1);
}

async function analyzeContentDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all content items
    const allItems = await SeoContentItem.find({}).exec();
    console.log(`\n📊 Total content items in database: ${allItems.length}`);

    if (allItems.length === 0) {
      console.log("❌ No content items found in database");
      await mongoose.disconnect();
      return;
    }

    // Analysis by status
    const byStatus = allItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log("\n📈 By status:");
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Analysis by category
    const byCategory = allItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log("\n📂 By category:");
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    // Analysis by language (heuristic based on title)
    const russianTitles = allItems.filter(item => {
      const title = item.title || "";
      return /[а-яё]/i.test(title);
    });
    const englishTitles = allItems.filter(item => {
      const title = item.title || "";
      return !/[а-яё]/i.test(title);
    });
    console.log(`\n🌍 Language breakdown (by title):`);
    console.log(`  Russian: ${russianTitles.length}`);
    console.log(`  English: ${englishTitles.length}`);

    // Analysis by backlogIdeaId
    const withBacklogId = allItems.filter(item => item.backlogIdeaId);
    const withoutBacklogId = allItems.filter(item => !item.backlogIdeaId);
    console.log(`\n📋 BacklogIdeaId breakdown:`);
    console.log(`  With backlogIdeaId: ${withBacklogId.length}`);
    console.log(`  Without backlogIdeaId: ${withoutBacklogId.length}`);

    // Analysis by projectId
    const byProject = allItems.reduce((acc, item) => {
      acc[item.projectId] = (acc[item.projectId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`\n🏢 By projectId:`);
    Object.entries(byProject).forEach(([projectId, count]) => {
      console.log(`  ${projectId}: ${count}`);
    });

    // Analysis by hypothesisId
    const byHypothesis = allItems.reduce((acc, item) => {
      const key = item.hypothesisId || "null/empty";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`\n🧪 By hypothesisId:`);
    Object.entries(byHypothesis).forEach(([hypothesisId, count]) => {
      console.log(`  ${hypothesisId}: ${count}`);
    });

    // Analysis by date
    const dates = allItems.map(item => item.createdAt).sort((a, b) => a.getTime() - b.getTime());
    if (dates.length > 0) {
      console.log(`\n📅 Date range:`);
      console.log(`  Oldest: ${dates[0].toISOString()}`);
      console.log(`  Newest: ${dates[dates.length - 1].toISOString()}`);
    }

    // Items from 16/11/2025
    const nov16Items = allItems.filter(item => {
      const date = item.createdAt;
      return date.getFullYear() === 2025 && date.getMonth() === 10 && date.getDate() === 16;
    });
    console.log(`\n🗓️ Items from 16/11/2025: ${nov16Items.length}`);
    if (nov16Items.length > 0) {
      console.log(`  Sample titles:`);
      nov16Items.slice(0, 10).forEach(item => {
        console.log(`    - ${item.title} (status: ${item.status}, category: ${item.category})`);
      });
    }

    // Analysis by date groups
    const byDate = allItems.reduce((acc, item) => {
      const date = item.createdAt;
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      acc[dateKey] = (acc[dateKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`\n📆 By creation date:`);
    Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        console.log(`  ${date}: ${count}`);
      });

    // Items for specific project and hypothesis (from memory)
    const testProjectId = "686774b6773b5947fed60a78";
    const testHypothesisId = "687fe5363c4cca83a3cc578d";
    const testItems = allItems.filter(item => 
      item.projectId === testProjectId && item.hypothesisId === testHypothesisId
    );
    console.log(`\n🎯 Items for test project/hypothesis:`);
    console.log(`  Project: ${testProjectId}`);
    console.log(`  Hypothesis: ${testHypothesisId}`);
    console.log(`  Count: ${testItems.length}`);
    if (testItems.length > 0) {
      const testByStatus = testItems.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`  By status:`, testByStatus);
      const testByCategory = testItems.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`  By category:`, testByCategory);
    }

    // Items that would be excluded (archived)
    const archivedItems = allItems.filter(item => item.status === "archived");
    console.log(`\n🗑️ Archived items (excluded from seoAgentContentIdeas): ${archivedItems.length}`);

    // Items that would be included
    const includedItems = allItems.filter(item => item.status !== "archived");
    console.log(`\n✅ Items that would be included (not archived): ${includedItems.length}`);

    // Simulate seoAgentContentIdeas query for test project/hypothesis
    const queryResult = await SeoContentItem.find({
      projectId: testProjectId,
      hypothesisId: testHypothesisId,
      status: { $ne: "archived" }
    }).sort({ updatedAt: -1 }).exec();
    
    console.log(`\n🔍 Simulating seoAgentContentIdeas query:`);
    console.log(`  Query: { projectId: "${testProjectId}", hypothesisId: "${testHypothesisId}", status: { $ne: "archived" } }`);
    console.log(`  Result count: ${queryResult.length}`);
    
    if (queryResult.length > 0) {
      const queryByStatus = queryResult.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`  By status:`, queryByStatus);
      
      const queryByCategory = queryResult.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`  By category:`, queryByCategory);
      
      const queryRussian = queryResult.filter(item => /[а-яё]/i.test(item.title || ""));
      const queryEnglish = queryResult.filter(item => !/[а-яё]/i.test(item.title || ""));
      console.log(`  Language: ${queryRussian.length} Russian, ${queryEnglish.length} English`);
      
      const queryWithBacklog = queryResult.filter(item => item.backlogIdeaId);
      const queryWithoutBacklog = queryResult.filter(item => !item.backlogIdeaId);
      console.log(`  BacklogIdeaId: ${queryWithBacklog.length} with, ${queryWithoutBacklog.length} without`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Analysis complete");
  } catch (error) {
    console.error("❌ Error analyzing database:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

analyzeContentDatabase();

