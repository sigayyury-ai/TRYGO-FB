/**
 * Script to restore clusters from backup JSON file
 * Usage: npx ts-node scripts/restore-clusters-from-backup.ts <backup-file-path>
 */

import mongoose from 'mongoose';
import { SeoCluster } from '../src/db/models/SeoCluster';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';

interface BackupCluster {
  _id: string;
  projectId: string;
  hypothesisId: string;
  title: string;
  intent: string;
  keywords: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

async function restoreClusters(backupFilePath: string) {
  try {
    console.log('🔄 Starting cluster restoration...');
    console.log(`📁 Backup file: ${backupFilePath}`);
    console.log('');

    // Check if file exists
    if (!fs.existsSync(backupFilePath)) {
      console.error(`❌ Backup file not found: ${backupFilePath}`);
      process.exit(1);
    }

    // Read backup file
    console.log('📖 Reading backup file...');
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8')) as BackupCluster[];
    console.log(`✅ Found ${backupData.length} clusters in backup`);
    console.log('');

    if (backupData.length === 0) {
      console.log('⚠️  No clusters to restore');
      return;
    }

    // Connect to MongoDB
    if (!MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('');

    // Show summary
    const projectIds = [...new Set(backupData.map(c => c.projectId))];
    const hypothesisIds = [...new Set(backupData.map(c => c.hypothesisId))];
    
    console.log('📊 Backup summary:');
    console.log(`   Projects: ${projectIds.length}`);
    projectIds.forEach((pid, idx) => {
      const count = backupData.filter(c => c.projectId === pid).length;
      console.log(`      ${idx + 1}. ${pid} (${count} clusters)`);
    });
    console.log(`   Hypotheses: ${hypothesisIds.length}`);
    hypothesisIds.forEach((hid, idx) => {
      const count = backupData.filter(c => c.hypothesisId === hid).length;
      console.log(`      ${idx + 1}. ${hid} (${count} clusters)`);
    });
    console.log('');

    // Check existing clusters
    let existingCount = 0;
    let toRestore: BackupCluster[] = [];

    for (const cluster of backupData) {
      const existing = await SeoCluster.findOne({
        projectId: cluster.projectId,
        hypothesisId: cluster.hypothesisId,
        title: cluster.title
      }).exec();

      if (existing) {
        existingCount++;
        console.log(`   ⚠️  Cluster "${cluster.title}" already exists (skipping)`);
      } else {
        toRestore.push(cluster);
      }
    }

    console.log('');
    console.log(`📊 Statistics:`);
    console.log(`   Total in backup: ${backupData.length}`);
    console.log(`   Already exist: ${existingCount}`);
    console.log(`   To restore: ${toRestore.length}`);
    console.log('');

    if (toRestore.length === 0) {
      console.log('✅ All clusters already exist in database. Nothing to restore.');
      return;
    }

    // Show what will be restored
    console.log('📋 Clusters to restore:');
    toRestore.forEach((cluster, index) => {
      console.log(`   ${index + 1}. ${cluster.title}`);
      console.log(`      ProjectId: ${cluster.projectId}`);
      console.log(`      HypothesisId: ${cluster.hypothesisId}`);
      console.log(`      Intent: ${cluster.intent}`);
      console.log(`      Keywords: ${cluster.keywords.length}`);
    });
    console.log('');

    // Restore clusters
    console.log('🔄 Restoring clusters...');
    let restored = 0;
    let errors = 0;

    for (const cluster of toRestore) {
      try {
        // Create new cluster (don't use original _id to avoid conflicts)
        const newCluster = new SeoCluster({
          projectId: cluster.projectId,
          hypothesisId: cluster.hypothesisId,
          title: cluster.title,
          intent: cluster.intent,
          keywords: cluster.keywords,
          createdBy: cluster.createdBy,
          updatedBy: cluster.updatedBy,
          createdAt: new Date(cluster.createdAt),
          updatedAt: new Date(cluster.updatedAt)
        });

        await newCluster.save();
        restored++;
        console.log(`   ✅ Restored: ${cluster.title}`);
      } catch (error: any) {
        errors++;
        console.error(`   ❌ Error restoring "${cluster.title}":`, error.message);
      }
    }

    console.log('');
    console.log(`✅ Restoration complete:`);
    console.log(`   Restored: ${restored}`);
    console.log(`   Errors: ${errors}`);

  } catch (error) {
    console.error('❌ Error during restoration:', error);
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
const backupFilePath = args[0];

if (!backupFilePath) {
  console.error('❌ Usage: npx ts-node scripts/restore-clusters-from-backup.ts <backup-file-path>');
  console.error('');
  console.error('Example:');
  console.error('   npx ts-node scripts/restore-clusters-from-backup.ts ../logs/backups/2025-12-11T09-24-30-796Z/test/seoclusters-backup-1765445073960.json');
  process.exit(1);
}

restoreClusters(backupFilePath).catch(console.error);

