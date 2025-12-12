/**
 * Script to restore market research data from old database
 * Usage: npx ts-node scripts/restore-market-research-from-old-db.ts <old-mongodb-uri> [new-mongodb-uri]
 * 
 * If new-mongodb-uri is not provided, uses MONGODB_URI from .env
 */

import mongoose from 'mongoose';
import HypothesesMarketResearchModel from '../src/models/HypothesesMarketResearchModel';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface BackupMarketResearch {
    _id?: string;
    userId: string;
    projectHypothesisId: string;
    threadId: string;
    summary: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

async function restoreMarketResearch(oldMongoUri: string, newMongoUri?: string) {
    let oldConnection: typeof mongoose | null = null;
    let newConnection: typeof mongoose | null = null;

    try {
        console.log('🔄 Starting market research restoration...');
        console.log(`📡 Old database: ${oldMongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        console.log('');

        // Connect to old database
        console.log('📡 Connecting to old database...');
        oldConnection = await mongoose.createConnection(oldMongoUri).asPromise();
        console.log('✅ Connected to old database');
        console.log('');

        // Get old model
        const OldMarketResearchModel = oldConnection.model(
            'HypothesesMarketResearch',
            HypothesesMarketResearchModel.schema
        );

        // Fetch all market research from old database
        console.log('📖 Fetching market research from old database...');
        const oldRecords = await OldMarketResearchModel.find({}).lean().exec();
        console.log(`✅ Found ${oldRecords.length} market research records in old database`);
        console.log('');

        if (oldRecords.length === 0) {
            console.log('⚠️  No market research records found in old database');
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
        let toRestore: BackupMarketResearch[] = [];

        console.log('🔍 Checking existing records...');
        for (const record of oldRecords) {
            const existing = await HypothesesMarketResearchModel.findOne({
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
            console.log('✅ All market research records already exist in new database. Nothing to restore.');
            return;
        }

        // Show what will be restored
        console.log('📋 Market research records to restore:');
        toRestore.slice(0, 10).forEach((record, index) => {
            console.log(`   ${index + 1}. Hypothesis: ${record.projectHypothesisId}`);
            console.log(`      User: ${record.userId}`);
            console.log(`      Summary: ${record.summary?.substring(0, 50)}...`);
        });
        if (toRestore.length > 10) {
            console.log(`   ... and ${toRestore.length - 10} more`);
        }
        console.log('');

        // Restore records
        console.log('🔄 Restoring market research records...');
        let restored = 0;
        let errors = 0;

        for (const record of toRestore) {
            try {
                const newRecord = new HypothesesMarketResearchModel({
                    userId: record.userId,
                    projectHypothesisId: record.projectHypothesisId,
                    threadId: record.threadId,
                    summary: record.summary,
                });

                await newRecord.save();
                restored++;
                if (restored % 10 === 0) {
                    console.log(`   ✅ Restored ${restored}/${toRestore.length}...`);
                }
            } catch (error: any) {
                errors++;
                console.error(`   ❌ Error restoring hypothesis ${record.projectHypothesisId}:`, error.message);
            }
        }

        console.log('');
        console.log(`✅ Restoration complete:`);
        console.log(`   Restored: ${restored}`);
        console.log(`   Errors: ${errors}`);

        // Check specific hypothesis
        const targetHypothesisId = '687fe5363c4cca83a3cc578d';
        const targetUserId = '686773b5773b5947fed60a68';
        const restoredRecord = await HypothesesMarketResearchModel.findOne({
            projectHypothesisId: targetHypothesisId,
            userId: targetUserId,
        }).exec();

        console.log('');
        if (restoredRecord) {
            console.log(`✅ Target hypothesis ${targetHypothesisId} has market research data!`);
        } else {
            console.log(`⚠️  Target hypothesis ${targetHypothesisId} still has no market research data`);
        }

    } catch (error) {
        console.error('❌ Error during restoration:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
        }
    } finally {
        if (oldConnection) {
            await oldConnection.close();
            console.log('🔌 Disconnected from old database');
        }
        if (newConnection) {
            await newConnection.disconnect();
            console.log('🔌 Disconnected from new database');
        }
    }
}

// Get command line arguments
const args = process.argv.slice(2);
const oldMongoUri = args[0];
const newMongoUri = args[1];

if (!oldMongoUri) {
    console.error('❌ Usage: npx ts-node scripts/restore-market-research-from-old-db.ts <old-mongodb-uri> [new-mongodb-uri]');
    console.error('');
    console.error('Example:');
    console.error('   npx ts-node scripts/restore-market-research-from-old-db.ts mongodb://old-host:27017/old-db');
    console.error('   npx ts-node scripts/restore-market-research-from-old-db.ts mongodb://old-host:27017/old-db mongodb://new-host:27017/new-db');
    process.exit(1);
}

restoreMarketResearch(oldMongoUri, newMongoUri).catch(console.error);
