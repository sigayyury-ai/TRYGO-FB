/**
 * Quick script to check clusters in database
 * Usage: 
 *   npx ts-node scripts/check-clusters.ts
 *   npx ts-node scripts/check-clusters.ts <projectId>
 *   npx ts-node scripts/check-clusters.ts <projectId> <hypothesisId>
 */

import mongoose from 'mongoose';
import { SeoCluster } from '../src/db/models/SeoCluster';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

async function checkClusters(projectId?: string, hypothesisId?: string) {
  try {
    console.log('🔍 Checking clusters in database...');
    console.log('');

    // Connect to MongoDB
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Get total count
    const totalClusters = await SeoCluster.countDocuments({}).exec();
    console.log(`📊 Total clusters in database: ${totalClusters}`);
    console.log('');

    if (totalClusters === 0) {
      console.log('⚠️  No clusters found in database');
      return;
    }

    // If projectId provided, filter by it
    if (projectId) {
      console.log(`🔍 Filtering by projectId: ${projectId}`);
      
      const query: any = { projectId };
      if (hypothesisId) {
        query.hypothesisId = hypothesisId;
        console.log(`🔍 Filtering by hypothesisId: ${hypothesisId}`);
      }
      
      const clusters = await SeoCluster.find(query)
        .sort({ updatedAt: -1 })
        .exec();
      
      console.log(`📊 Found ${clusters.length} clusters`);
      console.log('');
      
      if (clusters.length === 0) {
        console.log('⚠️  No clusters found with these criteria');
        console.log('');
        
        // Check if clusters exist for this project with different hypothesisId
        const projectClusters = await SeoCluster.find({ projectId }).exec();
        if (projectClusters.length > 0) {
          console.log(`ℹ️  But found ${projectClusters.length} clusters for this project with different hypothesisIds:`);
          const uniqueHypothesisIds = [...new Set(projectClusters.map(c => c.hypothesisId))];
          uniqueHypothesisIds.forEach((hid, index) => {
            const count = projectClusters.filter(c => c.hypothesisId === hid).length;
            console.log(`   ${index + 1}. hypothesisId: ${hid} (${count} clusters)`);
          });
        }
        
        // Check all projects
        const allProjects = await SeoCluster.distinct('projectId').exec();
        console.log('');
        console.log(`ℹ️  Available projectIds in database (${allProjects.length}):`);
        for (let index = 0; index < Math.min(allProjects.length, 10); index++) {
          const pid = allProjects[index];
          const count = await SeoCluster.countDocuments({ projectId: pid }).exec();
          console.log(`   ${index + 1}. ${pid} (${count} clusters)`);
        }
        if (allProjects.length > 10) {
          console.log(`   ... and ${allProjects.length - 10} more`);
        }
        
        return;
      }
      
      // Show clusters
      console.log('📋 Clusters:');
      clusters.forEach((cluster, index) => {
        console.log(`\n   ${index + 1}. ${cluster.title}`);
        console.log(`      ID: ${cluster._id.toString()}`);
        console.log(`      ProjectId: ${cluster.projectId}`);
        console.log(`      HypothesisId: ${cluster.hypothesisId}`);
        console.log(`      Intent: ${cluster.intent}`);
        console.log(`      Keywords: ${cluster.keywords.length} keywords`);
        if (cluster.keywords.length > 0) {
          console.log(`      Sample keywords: ${cluster.keywords.slice(0, 5).join(', ')}${cluster.keywords.length > 5 ? '...' : ''}`);
        }
        console.log(`      Created: ${cluster.createdAt.toISOString()}`);
        console.log(`      Updated: ${cluster.updatedAt.toISOString()}`);
      });
      
    } else {
      // Show overview
      console.log('📋 Overview of all clusters:');
      console.log('');
      
      // Get unique projects
      const uniqueProjects = await SeoCluster.distinct('projectId').exec();
      console.log(`📁 Found ${uniqueProjects.length} unique projects with clusters:`);
      console.log('');
      
      for (let i = 0; i < Math.min(uniqueProjects.length, 20); i++) {
        const pid = uniqueProjects[i];
        const projectClusters = await SeoCluster.find({ projectId: pid }).exec();
        const uniqueHypothesisIds = [...new Set(projectClusters.map(c => c.hypothesisId))];
        
        console.log(`   Project ${i + 1}: ${pid}`);
        console.log(`      Total clusters: ${projectClusters.length}`);
        console.log(`      HypothesisIds: ${uniqueHypothesisIds.length}`);
        for (const hid of uniqueHypothesisIds) {
          const count = projectClusters.filter(c => c.hypothesisId === hid).length;
          console.log(`         - ${hid}: ${count} clusters`);
        }
        console.log('');
      }
      
      if (uniqueProjects.length > 20) {
        console.log(`   ... and ${uniqueProjects.length - 20} more projects`);
        console.log('');
      }
      
      // Show sample clusters
      console.log('📋 Sample clusters (first 10):');
      const sampleClusters = await SeoCluster.find({})
        .sort({ updatedAt: -1 })
        .limit(10)
        .exec();
      
      sampleClusters.forEach((cluster, index) => {
        console.log(`\n   ${index + 1}. ${cluster.title}`);
        console.log(`      ProjectId: ${cluster.projectId}`);
        console.log(`      HypothesisId: ${cluster.hypothesisId}`);
        console.log(`      Intent: ${cluster.intent}`);
        console.log(`      Keywords: ${cluster.keywords.length}`);
      });
    }

    console.log('');
    console.log('✅ Check complete');

  } catch (error) {
    console.error('❌ Error checking clusters:', error);
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

checkClusters(projectId, hypothesisId).catch(console.error);
