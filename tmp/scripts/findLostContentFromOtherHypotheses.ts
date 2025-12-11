import "dotenv/config";
import mongoose from "mongoose";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables");
  process.exit(1);
}

const testProjectId = "686774b6773b5947fed60a78";
const testHypothesisId = "687fe5363c4cca83a3cc578d";

async function findLostContentFromOtherHypotheses() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all hypotheses for the project (using direct MongoDB query)
    const db = mongoose.connection.db;
    const hypothesesCollection = db.collection("hypotheses");
    const allHypotheses = await hypothesesCollection.find({ projectId: testProjectId }).toArray();
    console.log(`\n🧪 Found ${allHypotheses.length} hypotheses for project ${testProjectId}:`);
    allHypotheses.forEach((hyp: any) => {
      console.log(`  - ${hyp._id}: ${hyp.title || hyp.name || "Untitled"}`);
    });

    // Get all content items for the project (all hypotheses)
    const allContentItems = await SeoContentItem.find({
      projectId: testProjectId
    }).exec();

    console.log(`\n📊 Total content items for project: ${allContentItems.length}`);

    // Group by hypothesisId
    const byHypothesis = allContentItems.reduce((acc, item) => {
      const hypId = item.hypothesisId || "null/empty";
      if (!acc[hypId]) acc[hypId] = [];
      acc[hypId].push(item);
      return acc;
    }, {} as Record<string, typeof allContentItems>);

    console.log(`\n📋 Content items by hypothesis:`);
    Object.entries(byHypothesis).forEach(([hypId, items]) => {
      const hypothesis = allHypotheses.find((h: any) => h._id.toString() === hypId);
      const hypName = hypothesis?.title || hypothesis?.name || "Unknown hypothesis";
      console.log(`  Hypothesis ${hypId} (${hypName}): ${items.length} items`);
      
      const byStatus = items.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`    Statuses:`, byStatus);
      
      const byCategory = items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`    Categories:`, byCategory);
      
      // Show sample titles
      if (items.length > 0) {
        console.log(`    Sample titles:`);
        items.slice(0, 5).forEach(item => {
          console.log(`      - ${item.title} (status: ${item.status}, category: ${item.category})`);
        });
      }
    });

    // Find items from OTHER hypotheses (not the test hypothesis)
    const otherHypothesisItems = allContentItems.filter(item => 
      item.hypothesisId && item.hypothesisId !== testHypothesisId
    );

    console.log(`\n⚠️ Items from OTHER hypotheses (not ${testHypothesisId}): ${otherHypothesisItems.length}`);
    
    if (otherHypothesisItems.length > 0) {
      const otherByHypothesis = otherHypothesisItems.reduce((acc, item) => {
        const hypId = item.hypothesisId || "null/empty";
        if (!acc[hypId]) acc[hypId] = [];
        acc[hypId].push(item);
        return acc;
      }, {} as Record<string, typeof otherHypothesisItems>);

      Object.entries(otherByHypothesis).forEach(([hypId, items]) => {
        const hypothesis = allHypotheses.find((h: any) => h._id.toString() === hypId);
        const hypName = hypothesis?.title || hypothesis?.name || "Unknown hypothesis";
        console.log(`\n  Hypothesis ${hypId} (${hypName}): ${items.length} items`);
        
        const byStatus = items.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`    Statuses:`, byStatus);
        
        console.log(`    All titles:`);
        items.forEach(item => {
          console.log(`      - ${item.title} (status: ${item.status}, category: ${item.category}, created: ${item.createdAt})`);
        });
      });
    }

    // Check items for test hypothesis
    const testItems = allContentItems.filter(item => 
      item.hypothesisId === testHypothesisId
    );
    console.log(`\n🎯 Items for test hypothesis (${testHypothesisId}): ${testItems.length}`);

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`  Total content items in project: ${allContentItems.length}`);
    console.log(`  Items for test hypothesis: ${testItems.length}`);
    console.log(`  Items from other hypotheses: ${otherHypothesisItems.length}`);
    
    if (otherHypothesisItems.length > 0) {
      console.log(`\n💡 Recommendation:`);
      console.log(`  These ${otherHypothesisItems.length} items are "lost" because they belong to other hypotheses.`);
      console.log(`  You may want to:`);
      console.log(`    1. Move them to the correct hypothesis`);
      console.log(`    2. Create copies for the test hypothesis`);
      console.log(`    3. Keep them in their original hypotheses`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Analysis complete");
  } catch (error) {
    console.error("❌ Error analyzing content:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

findLostContentFromOtherHypotheses();

