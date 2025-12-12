import mongoose from 'mongoose';
import HypothesesMarketResearchModel from '../src/models/HypothesesMarketResearchModel';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const projectHypothesisId = '687fe5363c4cca83a3cc578d';
const userId = '686773b5773b5947fed60a68';

async function checkMarketResearch() {
    try {
        console.log('🔍 Checking market research in database...');
        console.log(`   Project Hypothesis ID: ${projectHypothesisId}`);
        console.log(`   User ID: ${userId}`);
        console.log('');

        // Connect to database
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to database');
        console.log('');

        // Check for market research with exact match
        const exactMatch = await HypothesesMarketResearchModel.findOne({
            projectHypothesisId,
            userId,
        });
        
        if (exactMatch) {
            console.log('✅ Found market research (exact match):');
            console.log(`   ID: ${exactMatch._id}`);
            console.log(`   Project Hypothesis ID: ${exactMatch.projectHypothesisId}`);
            console.log(`   User ID: ${exactMatch.userId}`);
            console.log(`   Thread ID: ${exactMatch.threadId || 'N/A'}`);
            console.log(`   Summary: ${exactMatch.summary ? 'Yes' : 'No'}`);
            const exactMatchDoc = exactMatch as any;
            console.log(`   Created: ${exactMatchDoc.createdAt || 'N/A'}`);
            console.log(`   Updated: ${exactMatchDoc.updatedAt || 'N/A'}`);
        } else {
            console.log('❌ No market research found (exact match)');
        }
        console.log('');

        // Check for market research with just projectHypothesisId (any user)
        const byHypothesis = await HypothesesMarketResearchModel.find({
            projectHypothesisId,
        });
        
        if (byHypothesis.length > 0) {
            console.log(`📊 Found ${byHypothesis.length} market research record(s) for this hypothesis (any user):`);
            byHypothesis.forEach((mr, index) => {
                const mrDoc = mr as any;
                console.log(`   ${index + 1}. ID: ${mr._id}, User ID: ${mr.userId}, Created: ${mrDoc.createdAt || 'N/A'}`);
            });
        } else {
            console.log('❌ No market research found for this hypothesis (any user)');
        }
        console.log('');

        // Check for market research with just userId (any hypothesis)
        const byUser = await HypothesesMarketResearchModel.find({
            userId,
        });
        
        console.log(`📊 Total market research records for this user: ${byUser.length}`);
        if (byUser.length > 0) {
            console.log('   Recent records:');
            byUser.slice(0, 5).forEach((mr, index) => {
                const mrDoc = mr as any;
                console.log(`   ${index + 1}. Hypothesis ID: ${mr.projectHypothesisId}, Created: ${mrDoc.createdAt || 'N/A'}`);
            });
        }
        console.log('');

        // Check all market research records
        const allRecords = await HypothesesMarketResearchModel.find({}).limit(10);
        console.log(`📊 Total market research records in database: ${await HypothesesMarketResearchModel.countDocuments({})}`);
        if (allRecords.length > 0) {
            console.log('   Sample records:');
            allRecords.forEach((mr, index) => {
                const mrDoc = mr as any;
                console.log(`   ${index + 1}. Hypothesis ID: ${mr.projectHypothesisId}, User ID: ${mr.userId}, Created: ${mrDoc.createdAt || 'N/A'}`);
            });
        }

        await mongoose.disconnect();
        console.log('');
        console.log('✅ Disconnected from database');
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

checkMarketResearch();
