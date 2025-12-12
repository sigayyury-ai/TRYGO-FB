/**
 * Script to import validation data from exported JSON file
 * Usage: npx ts-node scripts/import-validation-from-export.ts [json-file-path]
 */

import mongoose from 'mongoose';
import HypothesesValidationModel from '../src/models/HypothesesValidationModel';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

interface ValidationRecord {
    _id?: string;
    userId: string;
    projectHypothesisId?: string;
    hypothesisId?: string;
    threadId: string;
    validationChannels?: string[];
    customerInterviewQuestions?: string[];
    uploadedCustomerInterviews?: string;
    insightsCustomerInterviews?: string;
    summaryInterview?: any;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}

async function importValidation(jsonFilePath: string) {
    try {
        console.log('📥 Importing validation data...');
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
        const records: ValidationRecord[] = JSON.parse(fileContent);
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
        let toImport: ValidationRecord[] = [];

        console.log('🔍 Checking existing records...');
        for (const record of records) {
            const hypothesisId = record.projectHypothesisId || record.hypothesisId;
            if (!hypothesisId || !record.userId) {
                console.warn(`   ⚠️  Skipping record with missing hypothesisId or userId`);
                continue;
            }

            const existing = await HypothesesValidationModel.findOne({
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
            console.log('✅ All validation records already exist in database. Nothing to import.');
            return;
        }

        // Show what will be imported
        console.log('📋 Validation records to import:');
        toImport.slice(0, 10).forEach((record, index) => {
            const hypothesisId = record.projectHypothesisId || record.hypothesisId;
            console.log(`   ${index + 1}. Hypothesis: ${hypothesisId}, User: ${record.userId}`);
        });
        if (toImport.length > 10) {
            console.log(`   ... and ${toImport.length - 10} more`);
        }
        console.log('');

        // Import records
        console.log('🔄 Importing validation records...');
        let imported = 0;
        let errors = 0;

        for (const record of toImport) {
            try {
                const hypothesisId = record.projectHypothesisId || record.hypothesisId;
                if (!hypothesisId || !record.userId) {
                    continue;
                }

                const newRecord = new HypothesesValidationModel({
                    userId: record.userId,
                    projectHypothesisId: hypothesisId,
                    threadId: record.threadId,
                    validationChannels: record.validationChannels || [],
                    customerInterviewQuestions: record.customerInterviewQuestions || [],
                    uploadedCustomerInterviews: record.uploadedCustomerInterviews,
                    insightsCustomerInterviews: record.insightsCustomerInterviews,
                    summaryInterview: record.summaryInterview,
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
        const restoredRecord = await HypothesesValidationModel.findOne({
            projectHypothesisId: targetHypothesisId,
            userId: targetUserId,
        }).exec();

        console.log('');
        if (restoredRecord) {
            console.log(`✅ Target hypothesis ${targetHypothesisId} has validation data!`);
            console.log(`   Validation channels: ${restoredRecord.validationChannels?.length || 0}`);
            console.log(`   Interview questions: ${restoredRecord.customerInterviewQuestions?.length || 0}`);
            console.log(`   Has summary interview: ${restoredRecord.summaryInterview ? 'Yes' : 'No'}`);
        } else {
            console.log(`⚠️  Target hypothesis ${targetHypothesisId} still has no validation data`);
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
const jsonFilePath = args[0] || path.join(__dirname, '../../logs/backups/validation-export.json');

if (!jsonFilePath) {
    console.error('❌ Usage: npx ts-node scripts/import-validation-from-export.ts [json-file-path]');
    console.error('');
    console.error('Example:');
    console.error('   npx ts-node scripts/import-validation-from-export.ts');
    console.error('   npx ts-node scripts/import-validation-from-export.ts ../logs/backups/validation-export.json');
    process.exit(1);
}

importValidation(jsonFilePath).catch(console.error);
