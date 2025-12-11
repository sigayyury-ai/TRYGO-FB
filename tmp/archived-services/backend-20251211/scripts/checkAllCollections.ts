import mongoose from "mongoose";
import { env } from "../src/config/env.js";

async function checkAllCollections() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB\n");

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Get all collection names
    const collections = await db.listCollections().toArray();
    console.log("=== ALL COLLECTIONS IN DATABASE ===");
    console.log(`Total collections: ${collections.length}\n`);

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      console.log(`\nCollection: ${collectionName}`);
      console.log(`  Documents: ${count}`);

      if (count > 0 && count <= 10) {
        // Show all documents if 10 or less
        const docs = await db.collection(collectionName).find({}).limit(10).toArray();
        console.log(`  Sample documents:`);
        docs.forEach((doc, index) => {
          console.log(`    ${index + 1}. ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
        });
      } else if (count > 10) {
        // Show first 3 documents
        const docs = await db.collection(collectionName).find({}).limit(3).toArray();
        console.log(`  First 3 documents:`);
        docs.forEach((doc, index) => {
          console.log(`    ${index + 1}. ${JSON.stringify(doc, null, 2).substring(0, 200)}...`);
        });
      }

      // Check for backlog-related collections
      if (collectionName.toLowerCase().includes("backlog") || 
          collectionName.toLowerCase().includes("seo") ||
          collectionName.toLowerCase().includes("content") ||
          collectionName.toLowerCase().includes("cluster")) {
        console.log(`  ⚠️  POTENTIALLY RELATED TO SEO AGENT`);
      }
    }

    // Specifically check for SeoBacklogIdea collection
    console.log("\n\n=== CHECKING SEO BACKLOG COLLECTIONS ===");
    const backlogCollections = collections.filter(c => 
      c.name.toLowerCase().includes("backlog") || 
      c.name.toLowerCase().includes("seobacklog")
    );
    
    if (backlogCollections.length > 0) {
      for (const col of backlogCollections) {
        const count = await db.collection(col.name).countDocuments();
        console.log(`\n${col.name}: ${count} documents`);
        if (count > 0) {
          const docs = await db.collection(col.name).find({}).toArray();
          docs.forEach((doc, index) => {
            console.log(`\n  Document ${index + 1}:`);
            console.log(`    _id: ${doc._id}`);
            console.log(`    title: ${doc.title || 'N/A'}`);
            console.log(`    projectId: ${doc.projectId || 'N/A'}`);
            console.log(`    hypothesisId: ${doc.hypothesisId || 'N/A'}`);
            console.log(`    status: ${doc.status || 'N/A'}`);
          });
        }
      }
    } else {
      console.log("No backlog-related collections found!");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkAllCollections();

