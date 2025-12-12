/**
 * Script to export GTM (hypothesesGtm) data from old database to JSON file
 * Usage: npx ts-node scripts/export-gtm-from-old-db.ts [mongodb-uri] [output-file]
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function exportGtm(mongoUri?: string, outputFile?: string) {
    const uri = mongoUri || process.env.MONGODB_URI;
    const output = outputFile || path.join(__dirname, '../../logs/backups/gtm-export.json');
    
    if (!uri) {
        console.error('❌ MONGODB_URI not found. Provide it as argument or set in .env');
        process.exit(1);
    }

    try {
        console.log('📤 Exporting GTM (hypothesesGtm) data...');
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
            'hypothesesGtms',
            'hypothesesgtms',
            'hypothesesGtm',
            'hypothesesgtm',
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
            console.log('⚠️  No GTM records found in any collection');
            console.log('   Checking all collections for GTM-like data...');
            
            const collections = await db.listCollections().toArray();
            for (const collection of collections) {
                const col = db.collection(collection.name);
                const sample = await col.findOne({});
                if (sample) {
                    const keys = Object.keys(sample);
                    if (keys.some(k => 
                        k.toLowerCase().includes('gtm') || 
                        (k.toLowerCase().includes('stage') && keys.some(k2 => k2.toLowerCase().includes('channel')))
                    )) {
                        const count = await col.countDocuments({});
                        console.log(`   ⚠️  Collection "${collection.name}" has ${count} documents with GTM fields`);
                        if (count > 0 && count < 1000) {
                            const records = await col.find({}).toArray();
                            allRecords = allRecords.concat(records);
                            console.log(`   ✅ Exported ${records.length} records from "${collection.name}"`);
                        }
                    }
                }
            }
        }

        if (allRecords.length === 0) {
            console.log('❌ No GTM data found to export');
            await mongoose.disconnect();
            return;
        }

        // Convert ObjectIds to strings for JSON serialization
        const serializedRecords = allRecords.map(record => {
            const serialized: any = {
                _id: record._id?.toString(),
                userId: record.userId?.toString(),
                projectHypothesisId: record.projectHypothesisId?.toString(),
                threadId: record.threadId,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt,
            };

            // Serialize stages
            if (record.stageValidate) {
                serialized.stageValidate = serializeStage(record.stageValidate);
            }
            if (record.stageBuildAudience) {
                serialized.stageBuildAudience = serializeStage(record.stageBuildAudience);
            }
            if (record.stageScale) {
                serialized.stageScale = serializeStage(record.stageScale);
            }

            // Include all other fields
            Object.keys(record).forEach(key => {
                if (!['_id', 'userId', 'projectHypothesisId', 'threadId', 'createdAt', 'updatedAt', 'stageValidate', 'stageBuildAudience', 'stageScale'].includes(key)) {
                    if (record[key] && typeof record[key] === 'object' && record[key].constructor.name === 'ObjectId') {
                        serialized[key] = record[key].toString();
                    } else {
                        serialized[key] = record[key];
                    }
                }
            });

            return serialized;
        });

        function serializeStage(stage: any): any {
            if (!stage) return null;
            
            const serialized: any = {
                name: stage.name,
            };

            if (stage.channels && Array.isArray(stage.channels)) {
                serialized.channels = stage.channels.map((channel: any) => ({
                    name: channel.name,
                    type: channel.type,
                    description: channel.description,
                    kpis: channel.kpis,
                    status: channel.status,
                    strategy: channel.strategy,
                    _id: channel._id?.toString(),
                }));
            }

            return serialized;
        }

        // Ensure output directory exists
        const outputDir = path.dirname(output);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write to file
        fs.writeFileSync(output, JSON.stringify(serializedRecords, null, 2), 'utf-8');

        console.log('');
        console.log(`✅ Exported ${serializedRecords.length} GTM records to ${output}`);
        console.log('');

        // Show summary
        const userIds = [...new Set(serializedRecords.map(r => r.userId).filter(Boolean))];
        const hypothesisIds = [...new Set(serializedRecords.map(r => r.projectHypothesisId).filter(Boolean))];
        
        console.log('📊 Export summary:');
        console.log(`   Total records: ${serializedRecords.length}`);
        console.log(`   Unique users: ${userIds.length}`);
        console.log(`   Unique hypotheses: ${hypothesisIds.length}`);
        
        // Count records with stages
        const withValidate = serializedRecords.filter(r => r.stageValidate).length;
        const withBuildAudience = serializedRecords.filter(r => r.stageBuildAudience).length;
        const withScale = serializedRecords.filter(r => r.stageScale).length;
        
        console.log(`   Records with stageValidate: ${withValidate}`);
        console.log(`   Records with stageBuildAudience: ${withBuildAudience}`);
        console.log(`   Records with stageScale: ${withScale}`);
        console.log('');

        await mongoose.disconnect();
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

exportGtm(mongoUri, outputFile).catch(console.error);
