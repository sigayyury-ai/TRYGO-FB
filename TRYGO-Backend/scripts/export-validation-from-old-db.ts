/**
 * Script to export validation data from old database to JSON file
 * Usage: npx ts-node scripts/export-validation-from-old-db.ts [mongodb-uri] [output-file]
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function exportValidation(mongoUri?: string, outputFile?: string) {
    const uri = mongoUri || process.env.MONGODB_URI;
    const output = outputFile || path.join(__dirname, '../../logs/backups/validation-export.json');
    
    if (!uri) {
        console.error('❌ MONGODB_URI not found. Provide it as argument or set in .env');
        process.exit(1);
    }

    try {
        console.log('📤 Exporting validation data...');
        console.log(`📡 Database: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        console.log(`📁 Output file: ${output}`);
        console.log('');

        // Connect to database
        await mongoose.connect(uri);
        console.log('✅ Connected to database');
        console.log('');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection failed');
        }

        // Check validation collection
        const collectionName = 'hypothesesValidations';
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments({});
        
        if (count === 0) {
            console.log('⚠️  No validation records found in collection');
            await mongoose.disconnect();
            return;
        }

        console.log(`✅ Found collection "${collectionName}" with ${count} documents`);
        const records = await collection.find({}).toArray();
        console.log(`   Exported ${records.length} records from "${collectionName}"`);
        console.log('');

        // Convert ObjectIds to strings for JSON serialization
        const serializedRecords = records.map(record => ({
            _id: record._id?.toString(),
            userId: record.userId?.toString(),
            projectHypothesisId: record.projectHypothesisId?.toString() || record.hypothesisId?.toString(),
            hypothesisId: record.hypothesisId?.toString(),
            threadId: record.threadId,
            validationChannels: record.validationChannels || [],
            customerInterviewQuestions: record.customerInterviewQuestions || [],
            uploadedCustomerInterviews: record.uploadedCustomerInterviews,
            insightsCustomerInterviews: record.insightsCustomerInterviews,
            summaryInterview: record.summaryInterview,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        }));

        // Ensure output directory exists
        const outputDir = path.dirname(output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write to file
        fs.writeFileSync(output, JSON.stringify(serializedRecords, null, 2), 'utf-8');

        console.log(`✅ Exported ${serializedRecords.length} validation records to ${output}`);
        console.log('');

        // Show summary
        const userIds = [...new Set(serializedRecords.map(r => r.userId).filter(Boolean))];
        const hypothesisIds = [...new Set(serializedRecords.map(r => r.projectHypothesisId || r.hypothesisId).filter(Boolean))];
        
        console.log('📊 Export summary:');
        console.log(`   Total records: ${serializedRecords.length}`);
        console.log(`   Unique users: ${userIds.length}`);
        console.log(`   Unique hypotheses: ${hypothesisIds.length}`);
        console.log('');

        // Check for target hypothesis
        const targetHypothesisId = '687fe5363c4cca83a3cc578d';
        const targetUserId = '686773b5773b5947fed60a68';
        const targetRecord = serializedRecords.find(r => 
            (r.projectHypothesisId === targetHypothesisId || r.hypothesisId === targetHypothesisId) &&
            r.userId === targetUserId
        );

        if (targetRecord) {
            console.log(`✅ Found validation data for target hypothesis ${targetHypothesisId}!`);
            console.log(`   Record ID: ${targetRecord._id}`);
            console.log(`   Thread ID: ${targetRecord.threadId || 'N/A'}`);
            console.log(`   Validation channels: ${targetRecord.validationChannels?.length || 0}`);
            console.log(`   Interview questions: ${targetRecord.customerInterviewQuestions?.length || 0}`);
            console.log(`   Has summary interview: ${targetRecord.summaryInterview ? 'Yes' : 'No'}`);
        } else {
            console.log(`⚠️  No validation data found for target hypothesis ${targetHypothesisId}`);
        }

        await mongoose.disconnect();
        console.log('');
        console.log('✅ Disconnected from database');

    } catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('   Message:', error.message);
        }
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Get command line arguments
const args = process.argv.slice(2);
const mongoUri = args[0];
const outputFile = args[1];

exportValidation(mongoUri, outputFile).catch(console.error);
