/**
 * Script to check if market research data exists in old database/collection
 * Usage: npx ts-node scripts/check-old-db-for-market-research.ts [mongodb-uri]
 */

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkOldDatabase(mongoUri?: string) {
    const uri = mongoUri || process.env.MONGODB_URI;
    
    if (!uri) {
        console.error('❌ MONGODB_URI not found. Provide it as argument or set in .env');
        process.exit(1);
    }

    try {
        console.log('🔍 Checking database for market research data...');
        console.log(`📡 Database: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        console.log('');

        // Connect to database
        await mongoose.connect(uri);
        console.log('✅ Connected to database');
        console.log('');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection failed');
        }

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log('📋 Available collections:');
        collections.forEach((col, index) => {
            console.log(`   ${index + 1}. ${col.name}`);
        });
        console.log('');

        // Check for market research collection
        const collectionName = 'hypothesesMarketResearches';
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments({});
        
        if (count > 0) {
            console.log(`✅ Found collection "${collectionName}" with ${count} documents`);
            
            // Get sample records
            const samples = await collection.find({}).limit(5).toArray();
            console.log('   Sample records:');
            samples.forEach((sample, index) => {
                console.log(`   ${index + 1}. ID: ${sample._id}`);
                console.log(`      User ID: ${sample.userId}`);
                console.log(`      Hypothesis ID: ${sample.projectHypothesisId || sample.hypothesisId || 'N/A'}`);
                console.log(`      Summary: ${sample.summary?.substring(0, 50) || 'N/A'}...`);
            });
            console.log('');

            // Check for specific hypothesis
            const targetHypothesisId = '687fe5363c4cca83a3cc578d';
            const targetUserId = '686773b5773b5947fed60a68';
            
            // Try both ObjectId and string
            const targetRecord = await collection.findOne({
                $and: [
                    {
                        $or: [
                            { projectHypothesisId: new mongoose.Types.ObjectId(targetHypothesisId) },
                            { projectHypothesisId: targetHypothesisId },
                            { hypothesisId: new mongoose.Types.ObjectId(targetHypothesisId) },
                            { hypothesisId: targetHypothesisId },
                        ],
                    },
                    {
                        $or: [
                            { userId: new mongoose.Types.ObjectId(targetUserId) },
                            { userId: targetUserId },
                        ],
                    },
                ],
            });

            if (targetRecord) {
                console.log(`✅ Found market research for target hypothesis ${targetHypothesisId}!`);
                console.log(`   Record ID: ${targetRecord._id}`);
                console.log(`   User ID: ${targetRecord.userId}`);
                console.log(`   Hypothesis ID: ${targetRecord.projectHypothesisId || targetRecord.hypothesisId}`);
                console.log(`   Thread ID: ${targetRecord.threadId || 'N/A'}`);
                console.log(`   Summary length: ${targetRecord.summary?.length || 0} chars`);
            } else {
                console.log(`⚠️  No market research found for target hypothesis ${targetHypothesisId}`);
                console.log('   Checking all records for this user...');
                const userRecords = await collection.find({
                    $or: [
                        { userId: new mongoose.Types.ObjectId(targetUserId) },
                        { userId: targetUserId },
                    ],
                }).toArray();
                console.log(`   Found ${userRecords.length} market research records for this user`);
                if (userRecords.length > 0) {
                    console.log('   Hypothesis IDs:');
                    userRecords.forEach((r, i) => {
                        console.log(`      ${i + 1}. ${r.projectHypothesisId || r.hypothesisId || 'N/A'}`);
                    });
                }
            }
            console.log('');
        } else {
            console.log(`⚠️  Collection "${collectionName}" exists but is empty`);
        }

        // If no market research collection found, check all collections for market research-like data
        console.log('🔍 Checking all collections for market research-like data...');
        for (const collection of collections) {
            const col = db.collection(collection.name);
            const sample = await col.findOne({});
            if (sample) {
                const keys = Object.keys(sample);
                if (keys.some(k => k.toLowerCase().includes('market') || k.toLowerCase().includes('research'))) {
                    const count = await col.countDocuments({});
                    console.log(`   ⚠️  Collection "${collection.name}" has ${count} documents and contains market/research fields`);
                    console.log(`      Fields: ${keys.join(', ')}`);
                }
            }
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

checkOldDatabase(mongoUri).catch(console.error);
