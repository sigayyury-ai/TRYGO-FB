import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables");
  process.exit(1);
}

async function analyzeContentIssues() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all content items
    const allItems = await SeoContentItem.find({}).exec();
    console.log(`\n📊 Total content items in database: ${allItems.length}`);

    // Get all backlog items
    const allBacklogItems = await SeoBacklogIdea.find({}).exec();
    console.log(`📋 Total backlog items in database: ${allBacklogItems.length}`);

    // Test project and hypothesis IDs
    const testProjectId = "686774b6773b5947fed60a78";
    const testHypothesisId = "687fe5363c4cca83a3cc578d";

    // 1. Check items by projectId and hypothesisId
    console.log(`\n🔍 Analysis by projectId and hypothesisId:`);
    
    const itemsByProject = allItems.reduce((acc, item) => {
      const key = `${item.projectId || "null"}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, typeof allItems>);

    Object.entries(itemsByProject).forEach(([projectId, items]) => {
      console.log(`\n  Project: ${projectId} (${items.length} items)`);
      
      const byHypothesis = items.reduce((acc, item) => {
        const hypId = item.hypothesisId || "null/empty";
        if (!acc[hypId]) acc[hypId] = [];
        acc[hypId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      Object.entries(byHypothesis).forEach(([hypId, hypItems]) => {
        console.log(`    Hypothesis: ${hypId} (${hypItems.length} items)`);
        const byStatus = hypItems.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`      Statuses:`, byStatus);
        
        const withBacklog = hypItems.filter(item => item.backlogIdeaId);
        const withoutBacklog = hypItems.filter(item => !item.backlogIdeaId);
        console.log(`      With backlogIdeaId: ${withBacklog.length}, Without: ${withoutBacklog.length}`);
        
        // Check if backlog items exist for these content items
        if (withoutBacklog.length > 0) {
          console.log(`      ⚠️ ${withoutBacklog.length} items without backlogIdeaId (should be in backlog?)`);
          console.log(`      Sample titles without backlog:`);
          withoutBacklog.slice(0, 5).forEach(item => {
            console.log(`        - ${item.title} (status: ${item.status}, category: ${item.category})`);
          });
        }
      });
    });

    // 2. Check items for test project/hypothesis
    console.log(`\n🎯 Items for test project/hypothesis:`);
    const testItems = allItems.filter(item => 
      item.projectId === testProjectId && item.hypothesisId === testHypothesisId
    );
    console.log(`  Count: ${testItems.length}`);
    
    const testWithoutBacklog = testItems.filter(item => !item.backlogIdeaId);
    console.log(`  Without backlogIdeaId: ${testWithoutBacklog.length}`);
    
    // Check if these items should have backlog entries
    const testBacklogItems = allBacklogItems.filter(item => 
      item.projectId === testProjectId && item.hypothesisId === testHypothesisId
    );
    console.log(`  Backlog items for this project/hypothesis: ${testBacklogItems.length}`);
    
    // Find content items that might match backlog items by title
    console.log(`\n  🔗 Matching content items to backlog items:`);
    let matchedCount = 0;
    testWithoutBacklog.forEach(contentItem => {
      const matchingBacklog = testBacklogItems.find(backlog => 
        backlog.title === contentItem.title || 
        backlog.title?.toLowerCase() === contentItem.title?.toLowerCase()
      );
      if (matchingBacklog) {
        matchedCount++;
        console.log(`    ✅ Match found: "${contentItem.title}" -> backlogId: ${matchingBacklog._id}`);
      }
    });
    console.log(`  Total matches found: ${matchedCount}`);

    // 3. Check published items
    console.log(`\n📰 Published items analysis:`);
    const publishedItems = allItems.filter(item => item.status === "published");
    console.log(`  Total published: ${publishedItems.length}`);
    
    if (publishedItems.length > 0) {
      publishedItems.forEach(item => {
        console.log(`    - ${item.title}`);
        console.log(`      Project: ${item.projectId}, Hypothesis: ${item.hypothesisId}`);
        console.log(`      Category: ${item.category}, BacklogIdeaId: ${item.backlogIdeaId || "none"}`);
        console.log(`      Created: ${item.createdAt}, Updated: ${item.updatedAt}`);
      });
    }

    // 4. Check items with different hypothesisId (might be from wrong hypothesis)
    console.log(`\n⚠️ Items with different hypothesisId (might be lost):`);
    const otherHypothesisItems = allItems.filter(item => 
      item.projectId === testProjectId && item.hypothesisId !== testHypothesisId
    );
    console.log(`  Count: ${otherHypothesisItems.length}`);
    
    if (otherHypothesisItems.length > 0) {
      const byHypothesis = otherHypothesisItems.reduce((acc, item) => {
        const hypId = item.hypothesisId || "null/empty";
        if (!acc[hypId]) acc[hypId] = [];
        acc[hypId].push(item);
        return acc;
      }, {} as Record<string, typeof otherHypothesisItems>);
      
      Object.entries(byHypothesis).forEach(([hypId, items]) => {
        console.log(`    Hypothesis ${hypId}: ${items.length} items`);
        const byStatus = items.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`      Statuses:`, byStatus);
        console.log(`      Sample titles:`);
        items.slice(0, 5).forEach(item => {
          console.log(`        - ${item.title} (status: ${item.status}, category: ${item.category})`);
        });
      });
    }

    // 5. Check items without backlogIdeaId that should be in backlog
    console.log(`\n📋 Items without backlogIdeaId (should be in backlog?):`);
    const itemsWithoutBacklog = allItems.filter(item => !item.backlogIdeaId);
    console.log(`  Total: ${itemsWithoutBacklog.length}`);
    
    const testItemsWithoutBacklog = itemsWithoutBacklog.filter(item => 
      item.projectId === testProjectId && item.hypothesisId === testHypothesisId
    );
    console.log(`  For test project/hypothesis: ${testItemsWithoutBacklog.length}`);
    
    if (testItemsWithoutBacklog.length > 0) {
      const byCategory = testItemsWithoutBacklog.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`  By category:`, byCategory);
      
      const byStatus = testItemsWithoutBacklog.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`  By status:`, byStatus);
    }

    // 6. Summary and recommendations
    console.log(`\n📊 Summary:`);
    console.log(`  Total content items: ${allItems.length}`);
    console.log(`  Items for test project/hypothesis: ${testItems.length}`);
    console.log(`  Items without backlogIdeaId (test): ${testWithoutBacklog.length}`);
    console.log(`  Items with other hypothesisId: ${otherHypothesisItems.length}`);
    console.log(`  Published items: ${publishedItems.length}`);
    
    console.log(`\n💡 Recommendations:`);
    if (otherHypothesisItems.length > 0) {
      console.log(`  1. Found ${otherHypothesisItems.length} items with different hypothesisId - these might be "lost"`);
      console.log(`     Consider migrating them to correct hypothesisId or creating backlog items for them`);
    }
    if (testWithoutBacklog.length > 0) {
      console.log(`  2. Found ${testWithoutBacklog.length} items without backlogIdeaId for test project/hypothesis`);
      console.log(`     These should probably have backlog entries created`);
    }
    if (publishedItems.length > 0) {
      console.log(`  3. Found ${publishedItems.length} published items - need to ensure they are preserved`);
      console.log(`     Consider creating a separate collection or status for published content`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Analysis complete");
  } catch (error) {
    console.error("❌ Error analyzing database:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

analyzeContentIssues();


