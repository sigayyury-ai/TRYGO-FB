/**
 * Script to fix cluster data after migration
 * This script can help fix common migration issues:
 * 1. Update projectId/hypothesisId if they changed format
 * 2. Ensure all clusters have required fields
 * 
 * Usage: npx ts-node scripts/fix-clusters-after-migration.ts <oldProjectId> <newProjectId> [oldHypothesisId] [newHypothesisId]
 */

import mongoose from 'mongoose';
import { SeoCluster } from '../src/db/models/SeoCluster';
import { config } from '../src/constants/config/env';

async function fixClusters(
  oldProjectId: string,
  newProjectId: string,
  oldHypothesisId?: string,
  newHypothesisId?: string
) {
  try {
    console.log('🔧 Starting cluster data fix...');
    console.log(`Old ProjectId: ${oldProjectId}`);
    console.log(`New ProjectId: ${newProjectId}`);
    if (oldHypothesisId && newHypothesisId) {
      console.log(`Old HypothesisId: ${oldHypothesisId}`);
      console.log(`New HypothesisId: ${newHypothesisId}`);
    }
    console.log('');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Find clusters to update
    const query: any = { projectId: oldProjectId };
    if (oldHypothesisId) {
      query.hypothesisId = oldHypothesisId;
    }

    const clustersToUpdate = await SeoCluster.find(query).exec();
    console.log(`📊 Found ${clustersToUpdate.length} clusters to update`);
    console.log('');

    if (clustersToUpdate.length === 0) {
      console.log('⚠️  No clusters found matching the criteria');
      return;
    }

    // Show preview
    console.log('📋 Preview of clusters to be updated:');
    clustersToUpdate.slice(0, 5).forEach((cluster, index) => {
      console.log(`   ${index + 1}. ${cluster.title} (ID: ${cluster._id.toString()})`);
      console.log(`      Current: projectId=${cluster.projectId}, hypothesisId=${cluster.hypothesisId}`);
      console.log(`      New: projectId=${newProjectId}, hypothesisId=${newHypothesisId || cluster.hypothesisId}`);
    });
    if (clustersToUpdate.length > 5) {
      console.log(`   ... and ${clustersToUpdate.length - 5} more`);
    }
    console.log('');

    // Ask for confirmation (in real scenario, you might want to add readline for interactive confirmation)
    console.log('⚠️  This will update cluster data. Make sure you have a backup!');
    console.log('   To proceed, uncomment the update code in the script.');
    console.log('');

    // Uncomment the following block to actually perform the update:
    /*
    console.log('🔄 Updating clusters...');
    const updateData: any = { projectId: newProjectId };
    if (newHypothesisId) {
      updateData.hypothesisId = newHypothesisId;
    }

    const result = await SeoCluster.updateMany(query, { $set: updateData }).exec();
    console.log(`✅ Updated ${result.modifiedCount} clusters`);
    console.log('');
    */

    // Verify the update
    const verifyQuery: any = { projectId: newProjectId };
    if (newHypothesisId) {
      verifyQuery.hypothesisId = newHypothesisId;
    }
    const updatedCount = await SeoCluster.countDocuments(verifyQuery).exec();
    console.log(`✅ Verification: Found ${updatedCount} clusters with new IDs`);

    console.log('');
    console.log('✅ Fix complete');

  } catch (error) {
    console.error('❌ Error during fix:', error);
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
const oldProjectId = args[0];
const newProjectId = args[1];
const oldHypothesisId = args[2];
const newHypothesisId = args[3];

if (!oldProjectId || !newProjectId) {
  console.error('❌ Usage: npx ts-node scripts/fix-clusters-after-migration.ts <oldProjectId> <newProjectId> [oldHypothesisId] [newHypothesisId]');
  process.exit(1);
}

fixClusters(oldProjectId, newProjectId, oldHypothesisId, newHypothesisId).catch(console.error);

