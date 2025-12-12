/**
 * Script to restore packing data from old database
 * Usage: npx ts-node scripts/restore-packing-from-old-db.ts <old-mongodb-uri> [new-mongodb-uri]
 * 
 * If new-mongodb-uri is not provided, uses MONGODB_URI from .env
 */

import mongoose from 'mongoose';
import HypothesesPackingModel from '../src/models/HypothesesPackingModel';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface BackupPacking {
    _id?: string;
    userId: string;
    projectHypothesisId: string;
    threadId: string;
    summary: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

async function restorePacking(oldMongoUri: string, newMongoUri?: string) {
    let oldConnection: typeof mongoose | null = null;
    let newConnection: typeof mongoose | null = null;

    try {
        console.log('🔄 Starting packing restoration...');
        console.log(`📡 Old database: ${oldMongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        console.log('');

        // Connect to old database
        console.log('📡 Connecting to old database...');
        oldConnection = await mongoose.createConnection(oldMongoUri).asPromise();
        console.log('✅ Connected to old database');
        console.log('');

        // Get old model
        const OldPackingModel = oldConnection.model(
            'HypothesesPacking',
            HypothesesPackingModel.schema
        );

        // Fetch all packing from old database
        console.log('📖 Fetching packing from old database...');
        const oldRecords = await OldPackingModel.find({}).lean().exec();
        console.log(`✅ Found ${oldRecords.length} packing records in old database`);
        console.log('');

        if (oldRecords.length === 0) {
            console.log('⚠️  No packing records found in old database');
            return;
        }

        // Show summary
        const userIds = [...new Set(oldRecords.map(r => r.userId?.toString()))];
        const hypothesisIds = [...new Set(oldRecords.map(r => r.projectHypothesisId?.toString()))];
        
        console.log('📊 Old database summary:');
        console.log(`   Total records: ${oldRecords.length}`);
        console.log(`   Unique users: ${userIds.length}`);
        console.log(`   Unique hypotheses: ${hypothesisIds.length}`);
        console.log('');

        // Connect to new database
        const targetMongoUri = newMongoUri || process.env.MONGODB_URI;
        if (!targetMongoUri) {
            throw new Error('MONGODB_URI not found in environment variables and new-mongodb-uri not provided');
        }

        console.log('📡 Connecting to new database...');
        console.log(`   Target: ${targetMongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        await mongoose.connect(targetMongoUri);
        newConnection = mongoose;
        console.log('✅ Connected to new database');
        console.log('');

        // Check existing records
        let existingCount = 0;
        let toRestore: BackupPacking[] = [];

        console.log('🔍 Checking existing records...');
        for (const record of oldRecords) {
            const existing = await HypothesesPackingModel.findOne({
                projectHypothesisId: record.projectHypothesisId,
                userId: record.userId,
            }).exec();

            if (existing) {
                existingCount++;
            } else {
                toRestore.push({
                    userId: record.userId?.toString() || '',
                    projectHypothesisId: record.projectHypothesisId?.toString() || '',
                    threadId: record.threadId || '',
                    summary: record.summary || '',
                    createdAt: record.createdAt,
                    updatedAt: record.updatedAt,
                });
            }
        }

        console.log('');
        console.log(`📊 Statistics:`);
        console.log(`   Total in old database: ${oldRecords.length}`);
        console.log(`   Already exist: ${existingCount}`);
        console.log(`   To restore: ${toRestore.length}`);
        console.log('');

        if (toRestore.length === 0) {
            console.log('✅ All packing records already exist in new database. Nothing to restore.');
            return;
        }

        // Show what will be restored
        console.log('📋 Packing records to restore:');
        toRestore.slice(0, 10).forEach((record, index) => {
            console.log(`   ${index + 1}. User: ${record.userId}, Hypothesis: ${record.projectHypothesisId}`);
        });
        if (toRestore.length > 10) {
            console.log(`   ... and ${toRestore.length - 10} more`);
        }
        console.log('');

        // Restore records
        console.log('💾 Restoring packing records...');
        let restoredCount = 0;
        let errorCount = 0;

        for (const record of toRestore) {
            try {
                await HypothesesPackingModel.create({
                    userId: record.userId,
                    projectHypothesisId: record.projectHypothesisId,
                    threadId: record.threadId,
                    summary: record.summary,
                    createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
                    updatedAt: record.updatedAt ? new Date(record.updatedAt) : new Date(),
                });
                restoredCount++;
            } catch (error) {
                errorCount++;
                console.error(`   ❌ Error restoring record for user ${record.userId}, hypothesis ${record.projectHypothesisId}:`, error);
            }
        }

        console.log('');
        console.log(`✅ Restoration completed:`);
        console.log(`   Restored: ${restoredCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log('');

    } catch (error) {
        console.error('❌ Error during restoration:', error);
        throw error;
    } finally {
        // Close connections
        if (oldConnection) {
            await oldConnection.close();
            console.log('🔌 Closed old database connection');
        }
        if (newConnection && newConnection.connection.readyState === 1) {
            await newConnection.connection.close();
            console.log('🔌 Closed new database connection');
        }
    }
}

// Get command line arguments
const args = process.argv.slice(2);
const oldMongoUri = args[0];
const newMongoUri = args[1];

if (!oldMongoUri) {
    console.error('❌ Usage: npx ts-node scripts/restore-packing-from-old-db.ts <old-mongodb-uri> [new-mongodb-uri]');
    console.error('');
    console.error('Example:');
    console.error('   npx ts-node scripts/restore-packing-from-old-db.ts mongodb://old-host:27017/old-db');
    console.error('   npx ts-node scripts/restore-packing-from-old-db.ts mongodb://old-host:27017/old-db mongodb://new-host:27017/new-db');
    process.exit(1);
}

restorePacking(oldMongoUri, newMongoUri).catch(console.error);
