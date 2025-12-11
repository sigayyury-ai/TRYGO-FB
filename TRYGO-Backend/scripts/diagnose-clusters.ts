/**
 * Diagnostic script to check cluster data after migration
 * Run with: npx ts-node scripts/diagnose-clusters.ts <projectId> [hypothesisId]
 */

import mongoose from 'mongoose';
import { SeoCluster } from '../src/db/models/SeoCluster';
import { config } from '../src/constants/config/env';

async function diagnoseClusters(projectId: string, hypothesisId?: string) {
  try {
    console.log('🔍 Starting cluster diagnosis...');
    console.log(`ProjectId: ${projectId}`);
    console.log(`HypothesisId: ${hypothesisId || 'not provided'}`);
    console.log('');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Check total clusters for project
    const totalClusters = await SeoCluster.countDocuments({ projectId }).exec();
    console.log(`📊 Total clusters for project ${projectId}: ${totalClusters}`);
    console.log('');

    if (totalClusters === 0) {
      console.log('⚠️  No clusters found for this project');
      console.log('   This could mean:');
      console.log('   1. Clusters were not migrated');
      console.log('   2. ProjectId changed after migration');
      console.log('   3. Clusters are in a different collection');
      console.log('');
      
      // Check all collections that might contain clusters
      const db = mongoose.connection.db;
      const collections = await db?.listCollections().toArray();
      const clusterCollections = collections?.filter(c => 
        c.name.toLowerCase().includes('cluster')
      ) || [];
      
      if (clusterCollections.length > 0) {
        console.log('📁 Found cluster-related collections:');
        clusterCollections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
      }
      
      return;
    }

    // Get sample clusters
    const sampleClusters = await SeoCluster.find({ projectId })
      .limit(5)
      .exec();

    console.log(`📋 Sample clusters (showing ${sampleClusters.length} of ${totalClusters}):`);
    sampleClusters.forEach((cluster, index) => {
      console.log(`\n   Cluster ${index + 1}:`);
      console.log(`   - ID: ${cluster._id.toString()}`);
      console.log(`   - Title: ${cluster.title}`);
      console.log(`   - ProjectId: ${cluster.projectId} (type: ${typeof cluster.projectId})`);
      console.log(`   - HypothesisId: ${cluster.hypothesisId} (type: ${typeof cluster.hypothesisId})`);
      console.log(`   - Intent: ${cluster.intent}`);
      console.log(`   - Keywords: ${cluster.keywords.length} keywords`);
      console.log(`   - Created: ${cluster.createdAt}`);
      console.log(`   - Updated: ${cluster.updatedAt}`);
    });
    console.log('');

    // If hypothesisId provided, check clusters for that hypothesis
    if (hypothesisId) {
      const hypothesisClusters = await SeoCluster.countDocuments({
        projectId,
        hypothesisId
      }).exec();
      
      console.log(`🔍 Clusters for project ${projectId} AND hypothesis ${hypothesisId}: ${hypothesisClusters}`);
      
      if (hypothesisClusters === 0) {
        console.log('⚠️  No clusters found with this hypothesisId');
        console.log('');
        
        // Get unique hypothesisIds for this project
        const uniqueHypothesisIds = await SeoCluster.distinct('hypothesisId', { projectId }).exec();
        console.log(`📋 Available hypothesisIds for this project (${uniqueHypothesisIds.length}):`);
        uniqueHypothesisIds.forEach((id, index) => {
          const count = await SeoCluster.countDocuments({ projectId, hypothesisId: id }).exec();
          console.log(`   ${index + 1}. ${id} (${count} clusters)`);
        });
        console.log('');
        
        // Check if hypothesisId format might be different
        console.log('🔍 Checking for format mismatches...');
        const providedAsString = String(hypothesisId);
        const providedAsObjectId = new mongoose.Types.ObjectId(hypothesisId);
        
        const stringMatch = await SeoCluster.countDocuments({
          projectId,
          hypothesisId: providedAsString
        }).exec();
        
        console.log(`   - String match: ${stringMatch} clusters`);
        
        // Try ObjectId match if hypothesisId is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(hypothesisId)) {
          const objectIdMatch = await SeoCluster.countDocuments({
            projectId,
            hypothesisId: providedAsObjectId.toString()
          }).exec();
          console.log(`   - ObjectId string match: ${objectIdMatch} clusters`);
        }
      }
    } else {
      // Get unique hypothesisIds
      const uniqueHypothesisIds = await SeoCluster.distinct('hypothesisId', { projectId }).exec();
      console.log(`📋 Unique hypothesisIds for this project: ${uniqueHypothesisIds.length}`);
      uniqueHypothesisIds.slice(0, 10).forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });
      if (uniqueHypothesisIds.length > 10) {
        console.log(`   ... and ${uniqueHypothesisIds.length - 10} more`);
      }
    }

    console.log('');
    console.log('✅ Diagnosis complete');

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const projectId = args[0];
const hypothesisId = args[1];

if (!projectId) {
  console.error('❌ Usage: npx ts-node scripts/diagnose-clusters.ts <projectId> [hypothesisId]');
  process.exit(1);
}

diagnoseClusters(projectId, hypothesisId).catch(console.error);
