/**
 * Script to export market research data from old database to JSON file
 * Usage: npx ts-node scripts/export-market-research-from-old-db.ts [mongodb-uri] [output-file]
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function exportMarketResearch(mongoUri?: string, outputFile?: string) {
    const uri = mongoUri || process.env.MONGODB_URI;
    const output = outputFile || path.join(__dirname, '../../logs/backups/market-research-export.json');
    
    if (!uri) {
        console.error('❌ MONGODB_URI not found. Provide it as argument or set in .env');
        process.exit(1);
    }

    try {
        console.log('📤 Exporting market research data...');
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

        // Check all possible collection names
        const possibleNames = [
            'hypothesesMarketResearches',
            'hypothesesmarketresearches',
            'hypothesesMarketResearch',
            'hypothesesmarketresearch',
        ];

        let allRecords: any[] = [];

        for (const collectionName of possibleNames) {
            try {
                const collection = db.collection(collectionName);
                const count = await collection.countDocuments({});
                
                if (count > 0) {
                    console.log(`✅ Found collection "${collectionName}" with ${count} documents`);
                    const records = await collection.find({}).toArray();
                    allRecords = allRecords.concat(records);
                    console.log(`   Exported ${records.length} records from "${collectionName}"`);
                }
            } catch (error) {
                // Collection doesn't exist, skip
            }
        }

        if (allRecords.length === 0) {
            console.log('⚠️  No market research records found in any collection');
            console.log('   Checking all collections for market research-like data...');
            
            const collections = await db.listCollections().toArray();
            for (const collection of collections) {
                const col = db.collection(collection.name);
                const sample = await col.findOne({});
                if (sample) {
                    const keys = Object.keys(sample);
                    if (keys.some(k => 
                        k.toLowerCase().includes('market') || 
                        k.toLowerCase().includes('research') ||
                        (k.toLowerCase().includes('hypothesis') && keys.some(k2 => k2.toLowerCase().includes('summary')))
                    )) {
                        const count = await col.countDocuments({});
                        console.log(`   ⚠️  Collection "${collection.name}" has ${count} documents with market/research fields`);
                        if (count > 0 && count < 100) {
                            const records = await col.find({}).toArray();
                            allRecords = allRecords.concat(records);
                            console.log(`   ✅ Exported ${records.length} records from "${collection.name}"`);
                        }
                    }
                }
            }
        }

        if (allRecords.length === 0) {
            console.log('❌ No market research data found to export');
            await mongoose.disconnect();
            return;
        }

        // Convert ObjectIds to strings for JSON serialization
        const serializedRecords = allRecords.map(record => ({
            _id: record._id?.toString(),
            userId: record.userId?.toString(),
            projectHypothesisId: record.projectHypothesisId?.toString() || record.hypothesisId?.toString(),
            hypothesisId: record.hypothesisId?.toString(),
            threadId: record.threadId,
            summary: record.summary,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            // Include all other fields
            ...Object.fromEntries(
                Object.entries(record).filter(([key]) => 
                    !['_id', 'userId', 'projectHypothesisId', 'hypothesisId', 'threadId', 'summary', 'createdAt', 'updatedAt'].includes(key)
                )
            ),
        }));

        // Ensure output directory exists
        const outputDir = path.dirname(output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write to file
        fs.writeFileSync(output, JSON.stringify(serializedRecords, null, 2), 'utf-8');

        console.log('');
        console.log(`✅ Exported ${serializedRecords.length} market research records to ${output}`);
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
            console.log(`✅ Found market research for target hypothesis ${targetHypothesisId}!`);
            console.log(`   Record ID: ${targetRecord._id}`);
            console.log(`   Thread ID: ${targetRecord.threadId || 'N/A'}`);
            console.log(`   Summary length: ${targetRecord.summary?.length || 0} chars`);
        } else {
            console.log(`⚠️  No market research found for target hypothesis ${targetHypothesisId}`);
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

exportMarketResearch(mongoUri, outputFile).catch(console.error);
