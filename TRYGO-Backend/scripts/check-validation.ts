import mongoose from 'mongoose';
import HypothesesValidationModel from '../src/models/HypothesesValidationModel';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const projectHypothesisId = '687fe5363c4cca83a3cc578d';
const userId = '686773b5773b5947fed60a68';

async function checkValidation() {
    try {
        console.log('🔍 Checking validation data in database...');
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

        // Check for validation with exact match
        const exactMatch = await HypothesesValidationModel.findOne({
            projectHypothesisId,
            userId,
        });
        
        if (exactMatch) {
            console.log('✅ Found validation data (exact match):');
            console.log(`   ID: ${exactMatch._id}`);
            console.log(`   Project Hypothesis ID: ${exactMatch.projectHypothesisId}`);
            console.log(`   User ID: ${exactMatch.userId}`);
            console.log(`   Thread ID: ${exactMatch.threadId || 'N/A'}`);
            console.log(`   Has validation channels: ${exactMatch.validationChannels ? 'Yes' : 'No'}`);
            console.log(`   Has customer interview questions: ${exactMatch.customerInterviewQuestions ? 'Yes' : 'No'}`);
            console.log(`   Has uploaded interviews: ${exactMatch.uploadedCustomerInterviews ? 'Yes' : 'No'}`);
            console.log(`   Has summary interview: ${exactMatch.summaryInterview ? 'Yes' : 'No'}`);
            const exactMatchDoc = exactMatch as any;
            console.log(`   Created: ${exactMatchDoc.createdAt || 'N/A'}`);
            console.log(`   Updated: ${exactMatchDoc.updatedAt || 'N/A'}`);
        } else {
            console.log('❌ No validation data found (exact match)');
        }
        console.log('');

        // Check for validation with just projectHypothesisId (any user)
        const byHypothesis = await HypothesesValidationModel.find({
            projectHypothesisId,
        });
        
        if (byHypothesis.length > 0) {
            console.log(`📊 Found ${byHypothesis.length} validation record(s) for this hypothesis (any user):`);
            byHypothesis.forEach((val, index) => {
                const valDoc = val as any;
                console.log(`   ${index + 1}. ID: ${val._id}, User ID: ${val.userId}, Created: ${valDoc.createdAt || 'N/A'}`);
            });
        } else {
            console.log('❌ No validation data found for this hypothesis (any user)');
        }
        console.log('');

        // Check for validation with just userId (any hypothesis)
        const byUser = await HypothesesValidationModel.find({
            userId,
        });
        
        console.log(`📊 Total validation records for this user: ${byUser.length}`);
        if (byUser.length > 0) {
            console.log('   Recent records:');
            byUser.slice(0, 5).forEach((val, index) => {
                const valDoc = val as any;
                console.log(`   ${index + 1}. Hypothesis ID: ${val.projectHypothesisId}, Created: ${valDoc.createdAt || 'N/A'}`);
            });
        }
        console.log('');

        // Check all validation records
        const allRecords = await HypothesesValidationModel.find({}).limit(10);
        const totalCount = await HypothesesValidationModel.countDocuments({});
        console.log(`📊 Total validation records in database: ${totalCount}`);
        if (allRecords.length > 0) {
            console.log('   Sample records:');
            allRecords.forEach((val, index) => {
                const valDoc = val as any;
                console.log(`   ${index + 1}. Hypothesis ID: ${val.projectHypothesisId}, User ID: ${val.userId}, Created: ${valDoc.createdAt || 'N/A'}`);
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

checkValidation();
