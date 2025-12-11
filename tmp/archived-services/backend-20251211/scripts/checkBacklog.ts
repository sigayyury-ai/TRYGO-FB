import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { SeoBacklogIdea } from "../src/db/models/SeoBacklogIdea.js";
import { SeoContentItem } from "../src/db/models/SeoContentItem.js";

async function checkBacklog() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB\n");

    // Check ALL backlog items in database
    const allBacklogItems = await SeoBacklogIdea.find({}).exec();
    console.log("=== ALL BACKLOG ITEMS IN DATABASE ===");
    console.log(`Total backlog items: ${allBacklogItems.length}\n`);

    if (allBacklogItems.length > 0) {
      console.log("=== All Backlog Items ===");
      allBacklogItems.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   ProjectId: ${item.projectId}`);
        console.log(`   HypothesisId: ${item.hypothesisId || 'NULL'}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Category: ${item.category || 'N/A'}`);
        console.log(`   ContentType: ${item.contentType || 'N/A'}`);
        console.log(`   Description: ${item.description?.substring(0, 80) || 'N/A'}...`);
        console.log(`   Created: ${item.createdAt}`);
      });

      // Group by project
      const byProject = new Map<string, any[]>();
      allBacklogItems.forEach(item => {
        const key = item.projectId;
        if (!byProject.has(key)) {
          byProject.set(key, []);
        }
        byProject.get(key)!.push(item);
      });

      console.log("\n=== Backlog Items by Project ===");
      byProject.forEach((items, projId) => {
        console.log(`ProjectId: ${projId} - ${items.length} items`);
      });

      // Group by status
      const byStatus = new Map<string, number>();
      allBacklogItems.forEach(item => {
        const status = item.status || 'unknown';
        byStatus.set(status, (byStatus.get(status) || 0) + 1);
      });

      console.log("\n=== Backlog Items by Status ===");
      byStatus.forEach((count, status) => {
        console.log(`${status}: ${count}`);
      });
    } else {
      console.log("No backlog items found in database.");
    }

    // Check ALL ContentItems in database
    const allContentItems = await SeoContentItem.find({}).exec();
    console.log("\n=== ALL CONTENT ITEMS IN DATABASE ===");
    console.log(`Total content items: ${allContentItems.length}`);
    
    if (allContentItems.length > 0) {
      console.log("\n=== All Content Items ===");
      allContentItems.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.title}`);
        console.log(`   ID: ${item.id}`);
        console.log(`   ProjectId: ${item.projectId}`);
        console.log(`   HypothesisId: ${item.hypothesisId || 'NULL'}`);
        console.log(`   Status: ${item.status}`);
        console.log(`   Format: ${item.format || 'N/A'}`);
        console.log(`   Category: ${item.category || 'N/A'}`);
        console.log(`   BacklogIdeaId: ${item.backlogIdeaId || 'N/A'}`);
        console.log(`   Has Content: ${item.content ? 'Yes' : 'No'}`);
        console.log(`   Has Image: ${item.imageUrl ? 'Yes' : 'No'}`);
        console.log(`   Created: ${item.createdAt}`);
      });

      // Group by project
      const contentByProject = new Map<string, any[]>();
      allContentItems.forEach(item => {
        const key = item.projectId;
        if (!contentByProject.has(key)) {
          contentByProject.set(key, []);
        }
        contentByProject.get(key)!.push(item);
      });

      console.log("\n=== Content Items by Project ===");
      contentByProject.forEach((items, projId) => {
        console.log(`ProjectId: ${projId} - ${items.length} items`);
      });

      // Group by status
      const contentByStatus = new Map<string, number>();
      allContentItems.forEach(item => {
        const status = item.status || 'unknown';
        contentByStatus.set(status, (contentByStatus.get(status) || 0) + 1);
      });

      console.log("\n=== Content Items by Status ===");
      contentByStatus.forEach((count, status) => {
        console.log(`${status}: ${count}`);
      });
    } else {
      console.log("No content items found in database.");
    }

    // Check ALL clusters in database
    const { SeoCluster } = await import("../src/db/models/SeoCluster.js");
    const allClusters = await SeoCluster.find({}).exec();
    console.log("\n=== ALL CLUSTERS IN DATABASE ===");
    console.log(`Total clusters: ${allClusters.length}`);
    
    if (allClusters.length > 0) {
      console.log("\n=== All Clusters ===");
      allClusters.forEach((cluster, index) => {
        console.log(`\n${index + 1}. ${cluster.title}`);
        console.log(`   ID: ${cluster.id}`);
        console.log(`   ProjectId: ${cluster.projectId}`);
        console.log(`   HypothesisId: ${cluster.hypothesisId || 'NULL'}`);
        console.log(`   Intent: ${cluster.intent || 'N/A'}`);
        console.log(`   Keywords: ${cluster.keywords?.length || 0}`);
        console.log(`   Created: ${cluster.createdAt}`);
      });

      // Group by project
      const clustersByProject = new Map<string, any[]>();
      allClusters.forEach(cluster => {
        const key = cluster.projectId;
        if (!clustersByProject.has(key)) {
          clustersByProject.set(key, []);
        }
        clustersByProject.get(key)!.push(cluster);
      });

      console.log("\n=== Clusters by Project ===");
      clustersByProject.forEach((items, projId) => {
        console.log(`ProjectId: ${projId} - ${items.length} clusters`);
      });

      // Group by intent
      const clustersByIntent = new Map<string, number>();
      allClusters.forEach(cluster => {
        const intent = cluster.intent || 'unknown';
        clustersByIntent.set(intent, (clustersByIntent.get(intent) || 0) + 1);
      });

      console.log("\n=== Clusters by Intent ===");
      clustersByIntent.forEach((count, intent) => {
        console.log(`${intent}: ${count}`);
      });
    } else {
      console.log("No clusters found in database.");
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkBacklog();
