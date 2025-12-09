/**
 * Test script for OpenAI API
 * Tests if OpenAI API key is correctly configured
 */

require('dotenv').config();
const OpenAI = require('openai');

console.log('🔍 Testing OpenAI API Configuration...');
console.log('='.repeat(50));

// Check if key exists
const apiKey = process.env.OPENAI_API_KEY;
console.log('OpenAI API Key present:', !!apiKey);
console.log('OpenAI API Key length:', apiKey?.length || 0);

if (!apiKey) {
    console.error('\n❌ ERROR: OPENAI_API_KEY is not set in .env file');
    console.error('   Please add OPENAI_API_KEY=your-key-here to .env file');
    process.exit(1);
}

// Check key format
console.log('OpenAI API Key starts with:', apiKey.substring(0, 15) + '...');

if (apiKey.startsWith('-')) {
    console.error('\n⚠️  WARNING: API key starts with "-" (dash)');
    console.error('   This is likely incorrect. OpenAI API keys typically start with "sk-"');
    console.error('   First 30 chars:', apiKey.substring(0, 30));
    console.error('   Please check your .env file - remove leading dash if present');
    
    // Try with trimmed key
    const trimmedKey = apiKey.replace(/^-+/, '');
    if (trimmedKey.startsWith('sk-')) {
        console.log('\n💡 Found that removing leading dashes gives valid key format');
        console.log('   You should fix .env file: OPENAI_API_KEY=' + trimmedKey.substring(0, 20) + '...');
    }
}

// Test OpenAI API
async function testOpenAI() {
    console.log('\n📡 Testing OpenAI API connection...');
    
    try {
        const openai = new OpenAI({
            apiKey: apiKey.startsWith('-') ? apiKey.replace(/^-+/, '') : apiKey,
        });

        console.log('Sending test request to OpenAI...');
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ 
                role: 'user', 
                content: 'Say "Hello, AI Assistant is working!" in one sentence. Do not add any other text.' 
            }],
            max_tokens: 50,
            temperature: 0.7,
        });

        const message = response.choices[0]?.message?.content;
        
        console.log('\n✅ OpenAI API test successful!');
        console.log('Response:', message);
        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests passed! AI Assistant should work correctly.');
        return true;
    } catch (error) {
        console.error('\n❌ OpenAI API test failed!');
        console.error('Error:', error.message);
        
        if (error.message.includes('API key')) {
            console.error('\n💡 Troubleshooting:');
            console.error('   1. Check if OPENAI_API_KEY is correctly set in .env');
            console.error('   2. Make sure there are no extra quotes or spaces');
            console.error('   3. Verify the key is valid at https://platform.openai.com/api-keys');
            console.error('   4. If key starts with "-", remove it');
            
            if (apiKey.startsWith('-')) {
                console.error('\n   ⚠️  Your key starts with "-" - this is the problem!');
                console.error('   Fix: Remove the leading dash from OPENAI_API_KEY in .env');
            }
        } else if (error.message.includes('rate limit')) {
            console.error('   This is a rate limit error - your key is valid but you\'ve hit the limit');
        } else if (error.message.includes('insufficient_quota')) {
            console.error('   Your OpenAI account has insufficient quota');
        }
        
        return false;
    }
}

// Run test
testOpenAI()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });

