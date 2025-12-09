import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";

async function findMyBacklog() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Check all possible backlog collections
    console.log("=== Checking all backlog-related collections ===");
    const collections = await db.listCollections().toArray();
    const backlogCollections = collections.filter(c => 
      c.name.toLowerCase().includes("backlog")
    );

    for (const col of backlogCollections) {
      console.log(`\nCollection: ${col.name}`);
      const count = await db.collection(col.name).countDocuments();
      console.log(`  Total documents: ${count}`);

      if (count > 0) {
        // Get all documents
        const docs = await db.collection(col.name).find({}).toArray();
        console.log(`  All documents:`);
        docs.forEach((doc, index) => {
          console.log(`\n    ${index + 1}. Document:`);
          console.log(`       _id: ${doc._id}`);
          console.log(`       title: ${doc.title || 'N/A'}`);
          console.log(`       projectId: ${doc.projectId || 'N/A'}`);
          console.log(`       hypothesisId: ${doc.hypothesisId || 'N/A'}`);
          console.log(`       status: ${doc.status || 'N/A'}`);
          console.log(`       category: ${doc.category || 'N/A'}`);
          console.log(`       createdAt: ${doc.createdAt || 'N/A'}`);
          console.log(`       updatedAt: ${doc.updatedAt || 'N/A'}`);
        });
      }
    }

    // Check using the model (should use seobacklogideas collection)
    console.log("\n\n=== Checking via SeoBacklogIdea model ===");
    const allBacklogItems = await SeoBacklogIdea.find({}).exec();
    console.log(`Total items via model: ${allBacklogItems.length}`);

    if (allBacklogItems.length > 0) {
      console.log("\nAll backlog items:");
      allBacklogItems.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   ProjectId: ${item.projectId}`);
        console.log(`   HypothesisId: ${item.hypothesisId}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Category: ${item.category}`);
        console.log(`   Created: ${item.createdAt}`);
      });
    }

    // Check for items with different projectIds
    console.log("\n\n=== Checking for items with different projectIds ===");
    const allItems = await db.collection("seobacklogideas").find({}).toArray();
    const allItemsAlt = await db.collection("seoAgentBacklogIdeas").find({}).toArray();
    
    const allItemsCombined = [...allItems, ...allItemsAlt];
    
    if (allItemsCombined.length > 0) {
      console.log(`Found ${allItemsCombined.length} items in both collections`);
      
      // Group by projectId
      const byProject = new Map<string, any[]>();
      allItemsCombined.forEach(item => {
        const projId = item.projectId || 'NO_PROJECT_ID';
        if (!byProject.has(projId)) {
          byProject.set(projId, []);
        }
        byProject.get(projId)!.push(item);
      });

      console.log("\nItems grouped by projectId:");
      byProject.forEach((items, projId) => {
        console.log(`\n  ProjectId: ${projId} - ${items.length} items`);
        items.forEach((item, idx) => {
          console.log(`    ${idx + 1}. ${item.title || 'NO_TITLE'}`);
          console.log(`       HypothesisId: ${item.hypothesisId || 'NO_HYPOTHESIS'}`);
          console.log(`       Status: ${item.status || 'NO_STATUS'}`);
        });
      });
    } else {
      console.log("No items found in any backlog collection");
    }

    // Check if there are any items that might have been created but not saved
    console.log("\n\n=== Checking for items with missing required fields ===");
    const itemsWithMissingFields = await db.collection("seobacklogideas").find({
      $or: [
        { projectId: { $exists: false } },
        { hypothesisId: { $exists: false } },
        { title: { $exists: false } }
      ]
    }).toArray();
    
    if (itemsWithMissingFields.length > 0) {
      console.log(`Found ${itemsWithMissingFields.length} items with missing required fields`);
      itemsWithMissingFields.forEach((item, index) => {
        console.log(`\n${index + 1}. ${JSON.stringify(item, null, 2)}`);
      });
    } else {
      console.log("No items with missing required fields");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

findMyBacklog();

