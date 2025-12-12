/**
 * Script to check if validation data exists in old database/collection
 * Usage: npx ts-node scripts/check-old-db-for-validation.ts [mongodb-uri]
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
        console.log('🔍 Checking database for validation data...');
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

        // Check for validation collection
        const collectionName = 'hypothesesValidations';
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
                console.log(`      Has validation channels: ${sample.validationChannels ? 'Yes' : 'No'}`);
                console.log(`      Has interview questions: ${sample.customerInterviewQuestions ? 'Yes' : 'No'}`);
                console.log(`      Has summary interview: ${sample.summaryInterview ? 'Yes' : 'No'}`);
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
                console.log(`✅ Found validation data for target hypothesis ${targetHypothesisId}!`);
                console.log(`   Record ID: ${targetRecord._id}`);
                console.log(`   User ID: ${targetRecord.userId}`);
                console.log(`   Hypothesis ID: ${targetRecord.projectHypothesisId || targetRecord.hypothesisId}`);
                console.log(`   Thread ID: ${targetRecord.threadId || 'N/A'}`);
                console.log(`   Validation channels: ${targetRecord.validationChannels?.length || 0}`);
                console.log(`   Interview questions: ${targetRecord.customerInterviewQuestions?.length || 0}`);
                console.log(`   Has summary interview: ${targetRecord.summaryInterview ? 'Yes' : 'No'}`);
            } else {
                console.log(`⚠️  No validation data found for target hypothesis ${targetHypothesisId}`);
                console.log('   Checking all records for this user...');
                const userRecords = await collection.find({
                    $or: [
                        { userId: new mongoose.Types.ObjectId(targetUserId) },
                        { userId: targetUserId },
                    ],
                }).toArray();
                console.log(`   Found ${userRecords.length} validation records for this user`);
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
