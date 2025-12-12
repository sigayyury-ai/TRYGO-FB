/**
 * Script to restore GTM (hypothesesGtm) data from old database
 * Usage: npx ts-node scripts/restore-gtm-from-old-db.ts <old-mongodb-uri> [new-mongodb-uri]
 * 
 * If new-mongodb-uri is not provided, uses MONGODB_URI from .env
 */

import mongoose from 'mongoose';
import HypothesesGtmModel from '../src/models/HypothesesGtmModel';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface BackupGtm {
    _id?: string;
    userId: string;
    projectHypothesisId: string;
    threadId: string;
    stageValidate?: any;
    stageBuildAudience?: any;
    stageScale?: any;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

async function restoreGtm(oldMongoUri: string, newMongoUri?: string) {
    let oldConnection: typeof mongoose | null = null;
    let newConnection: typeof mongoose | null = null;

    try {
        console.log('🔄 Starting GTM restoration...');
        console.log(`📡 Old database: ${oldMongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        console.log('');

        // Connect to old database
        console.log('📡 Connecting to old database...');
        oldConnection = await mongoose.createConnection(oldMongoUri).asPromise();
        console.log('✅ Connected to old database');
        console.log('');

        // Get old model
        const OldGtmModel = oldConnection.model(
            'HypothesesGtm',
            HypothesesGtmModel.schema
        );

        // Fetch all GTM from old database
        console.log('📖 Fetching GTM from old database...');
        const oldRecords = await OldGtmModel.find({}).lean().exec();
        console.log(`✅ Found ${oldRecords.length} GTM records in old database`);
        console.log('');

        if (oldRecords.length === 0) {
            console.log('⚠️  No GTM records found in old database');
            return;
        }

        // Show summary
        const userIds = [...new Set(oldRecords.map(r => r.userId?.toString()))];
        const hypothesisIds = [...new Set(oldRecords.map(r => r.projectHypothesisId?.toString()))];
        
        console.log('📊 Old database summary:');
        console.log(`   Total records: ${oldRecords.length}`);
        console.log(`   Unique users: ${userIds.length}`);
        console.log(`   Unique hypotheses: ${hypothesisIds.length}`);
        
        // Count records with stages
        const withValidate = oldRecords.filter(r => r.stageValidate).length;
        const withBuildAudience = oldRecords.filter(r => r.stageBuildAudience).length;
        const withScale = oldRecords.filter(r => r.stageScale).length;
        
        console.log(`   Records with stageValidate: ${withValidate}`);
        console.log(`   Records with stageBuildAudience: ${withBuildAudience}`);
        console.log(`   Records with stageScale: ${withScale}`);
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
        let toRestore: BackupGtm[] = [];

        console.log('🔍 Checking existing records...');
        for (const record of oldRecords) {
            const existing = await HypothesesGtmModel.findOne({
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
                    stageValidate: record.stageValidate,
                    stageBuildAudience: record.stageBuildAudience,
                    stageScale: record.stageScale,
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
            console.log('✅ All GTM records already exist in new database. Nothing to restore.');
            return;
        }

        // Show what will be restored
        console.log('📋 GTM records to restore:');
        toRestore.slice(0, 10).forEach((record, index) => {
            console.log(`   ${index + 1}. Hypothesis: ${record.projectHypothesisId}`);
            console.log(`      User: ${record.userId}`);
            const stages = [];
            if (record.stageValidate) stages.push('Validate');
            if (record.stageBuildAudience) stages.push('BuildAudience');
            if (record.stageScale) stages.push('Scale');
            console.log(`      Stages: ${stages.join(', ') || 'none'}`);
        });
        if (toRestore.length > 10) {
            console.log(`   ... and ${toRestore.length - 10} more`);
        }
        console.log('');

        // Restore records
        console.log('🔄 Restoring GTM records...');
        let restored = 0;
        let errors = 0;

        for (const record of toRestore) {
            try {
                const newRecord = new HypothesesGtmModel({
                    userId: record.userId,
                    projectHypothesisId: record.projectHypothesisId,
                    threadId: record.threadId,
                    stageValidate: record.stageValidate || undefined,
                    stageBuildAudience: record.stageBuildAudience || undefined,
                    stageScale: record.stageScale || undefined,
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
    console.error('❌ Usage: npx ts-node scripts/restore-gtm-from-old-db.ts <old-mongodb-uri> [new-mongodb-uri]');
    console.error('');
    console.error('Example:');
    console.error('   npx ts-node scripts/restore-gtm-from-old-db.ts mongodb://old-host:27017/old-db');
    console.error('   npx ts-node scripts/restore-gtm-from-old-db.ts mongodb://old-host:27017/old-db mongodb://new-host:27017/new-db');
    console.error('');
    console.error('To restore from "test" database (if same MongoDB server):');
    console.error('   Replace database name in MONGODB_URI from "trygo" to "test"');
    process.exit(1);
}

restoreGtm(oldMongoUri, newMongoUri).catch(console.error);
