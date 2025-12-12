/**
 * Script to import market research data from exported JSON file
 * Usage: npx ts-node scripts/import-market-research-from-export.ts [json-file-path]
 */

import mongoose from 'mongoose';
import HypothesesMarketResearchModel from '../src/models/HypothesesMarketResearchModel';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface MarketResearchRecord {
    _id?: string;
    userId: string;
    projectHypothesisId?: string;
    hypothesisId?: string;
    threadId: string;
    summary: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

async function importMarketResearch(jsonFilePath: string) {
    try {
        console.log('📥 Importing market research data...');
        console.log(`📁 JSON file: ${jsonFilePath}`);
        console.log('');

        // Check if file exists
        if (!fs.existsSync(jsonFilePath)) {
            console.error(`❌ File not found: ${jsonFilePath}`);
            process.exit(1);
        }

        // Read JSON file
        console.log('📖 Reading JSON file...');
        const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
        const records: MarketResearchRecord[] = JSON.parse(fileContent);
        console.log(`✅ Found ${records.length} records in file`);
        console.log('');

        if (records.length === 0) {
            console.log('⚠️  No records to import');
            return;
        }

        // Connect to database
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('📡 Connecting to database...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database');
        console.log('');

        // Show summary
        const userIds = [...new Set(records.map(r => r.userId).filter(Boolean))];
        const hypothesisIds = [...new Set(records.map(r => r.projectHypothesisId || r.hypothesisId).filter(Boolean))];
        
        console.log('📊 Import summary:');
        console.log(`   Total records: ${records.length}`);
        console.log(`   Unique users: ${userIds.length}`);
        console.log(`   Unique hypotheses: ${hypothesisIds.length}`);
        console.log('');

        // Check existing records
        let existingCount = 0;
        let toImport: MarketResearchRecord[] = [];

        console.log('🔍 Checking existing records...');
        for (const record of records) {
            const hypothesisId = record.projectHypothesisId || record.hypothesisId;
            if (!hypothesisId || !record.userId) {
                console.warn(`   ⚠️  Skipping record with missing hypothesisId or userId`);
                continue;
            }

            const existing = await HypothesesMarketResearchModel.findOne({
                projectHypothesisId: hypothesisId,
                userId: record.userId,
            }).exec();

            if (existing) {
                existingCount++;
            } else {
                toImport.push(record);
            }
        }

        console.log('');
        console.log(`📊 Statistics:`);
        console.log(`   Total in file: ${records.length}`);
        console.log(`   Already exist: ${existingCount}`);
        console.log(`   To import: ${toImport.length}`);
        console.log('');

        if (toImport.length === 0) {
            console.log('✅ All market research records already exist in database. Nothing to import.');
            return;
        }

        // Show what will be imported
        console.log('📋 Market research records to import:');
        toImport.slice(0, 10).forEach((record, index) => {
            const hypothesisId = record.projectHypothesisId || record.hypothesisId;
            console.log(`   ${index + 1}. Hypothesis: ${hypothesisId}, User: ${record.userId}`);
        });
        if (toImport.length > 10) {
            console.log(`   ... and ${toImport.length - 10} more`);
        }
        console.log('');

        // Import records
        console.log('🔄 Importing market research records...');
        let imported = 0;
        let errors = 0;

        for (const record of toImport) {
            try {
                const hypothesisId = record.projectHypothesisId || record.hypothesisId;
                if (!hypothesisId || !record.userId) {
                    continue;
                }

                const newRecord = new HypothesesMarketResearchModel({
                    userId: record.userId,
                    projectHypothesisId: hypothesisId,
                    threadId: record.threadId,
                    summary: record.summary,
                });

                await newRecord.save();
                imported++;
                if (imported % 10 === 0) {
                    console.log(`   ✅ Imported ${imported}/${toImport.length}...`);
                }
            } catch (error: any) {
                errors++;
                const hypothesisId = record.projectHypothesisId || record.hypothesisId;
                console.error(`   ❌ Error importing hypothesis ${hypothesisId}:`, error.message);
            }
        }

        console.log('');
        console.log(`✅ Import complete:`);
        console.log(`   Imported: ${imported}`);
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
            console.log(`   This hypothesis may not have been in the old database`);
        }

        await mongoose.disconnect();
        console.log('');
        console.log('✅ Disconnected from database');

    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
            console.error('   Stack:', error.stack);
        }
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);
const jsonFilePath = args[0] || path.join(__dirname, '../../logs/backups/market-research-export.json');

if (!jsonFilePath) {
    console.error('❌ Usage: npx ts-node scripts/import-market-research-from-export.ts [json-file-path]');
    console.error('');
    console.error('Example:');
    console.error('   npx ts-node scripts/import-market-research-from-export.ts');
    console.error('   npx ts-node scripts/import-market-research-from-export.ts ../logs/backups/market-research-export.json');
    process.exit(1);
}

importMarketResearch(jsonFilePath).catch(console.error);
