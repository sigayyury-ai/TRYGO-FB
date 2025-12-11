/**
 * Full integration test for AI Assistant
 * Tests: Login -> Get Projects -> Socket.IO Connection -> Send Message -> Receive Answer
 */

require('dotenv').config();
const io = require('socket.io-client');
const fetch = require('node-fetch');

const GRAPHQL_URL = process.env.VITE_SERVER_URL || 'http://localhost:5001/graphql';
const WS_URL = process.env.VITE_WS_SERVER_URL || 'ws://localhost:5001';
// Use same test credentials as test-full-stabilization.js
const TEST_EMAIL = process.env.TEST_EMAIL || 'sigayyury5@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '1237895aA';

console.log('🧪 Full AI Assistant Integration Test');
console.log('='.repeat(60));
console.log('GraphQL URL:', GRAPHQL_URL);
console.log('Socket.IO URL:', WS_URL);
console.log('Test Email:', TEST_EMAIL);

// GraphQL helper
async function graphqlRequest(query, variables = {}, token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            query,
            variables,
        }),
    });
    
    const data = await response.json();
    
    if (data.errors) {
        throw new Error(`GraphQL Error: ${JSON.stringify(data.errors)}`);
    }
    
    return data.data;
}

// Step 1: Login
async function login() {
    console.log('\n📝 Step 1: Logging in...');
    
    const loginMutation = `
        mutation Login($input: LoginInput) {
            login(input: $input) {
                token
                user {
                    id
                    email
                }
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(loginMutation, {
            input: {
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
            },
        });
        
        if (!data.login || !data.login.token) {
            throw new Error('Login failed: No token received');
        }
        
        console.log('✅ Login successful!');
        console.log('   User ID:', data.login.user.id);
        console.log('   Email:', data.login.user.email);
        console.log('   Token:', data.login.token.substring(0, 20) + '...');
        
        return data.login.token;
    } catch (error) {
        console.error('❌ Login failed:', error.message);
        throw error;
    }
}

// Step 2: Get Projects
async function getProjects(token) {
    console.log('\n📁 Step 2: Getting projects...');
    
    const getProjectsQuery = `
        query GetProjects {
            getProjects {
                id
                title
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(getProjectsQuery, {}, token);
        
        if (!data.getProjects || data.getProjects.length === 0) {
            throw new Error('No projects found. Please create a project first.');
        }
        
        const project = data.getProjects[0];
        console.log('✅ Projects retrieved!');
        console.log('   Project ID:', project.id);
        console.log('   Project Title:', project.title);
        
        return project;
    } catch (error) {
        console.error('❌ Get projects failed:', error.message);
        throw error;
    }
}

// Step 3: Get Hypotheses
async function getHypotheses(token, projectId) {
    console.log('\n💡 Step 3: Getting hypotheses...');
    
    const getHypothesesQuery = `
        query GetProjectHypotheses($projectId: ID!) {
            getProjectHypotheses(projectId: $projectId) {
                id
                title
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(getHypothesesQuery, { projectId }, token);
        
        if (!data.getProjectHypotheses || data.getProjectHypotheses.length === 0) {
            throw new Error('No hypotheses found. Please create a hypothesis first.');
        }
        
        const hypothesis = data.getProjectHypotheses[0];
        const hypothesisId = hypothesis.id;
        console.log('✅ Hypotheses retrieved!');
        console.log('   Hypothesis ID:', hypothesisId);
        console.log('   Hypothesis Title:', hypothesis.title);
        console.log('   Thread ID: Will be created automatically by backend');
        
        return { id: hypothesisId };
    } catch (error) {
        console.error('❌ Get hypotheses failed:', error.message);
        throw error;
    }
}

// Step 4: Test Socket.IO Connection and Send Message
async function testSocketIOMessage(token, projectId, hypothesisId) {
    console.log('\n🔌 Step 4: Testing Socket.IO connection and sending message...');
    
    return new Promise((resolve, reject) => {
        const socket = io(WS_URL, {
            transports: ['websocket'],
            query: { token },
            timeout: 10000,
        });
        
        let connected = false;
        let messageReceived = false;
        const timeout = setTimeout(() => {
            if (!messageReceived) {
                socket.disconnect();
                reject(new Error('Timeout: No response received within 60 seconds'));
            }
        }, 60000);
        
        socket.on('connect', () => {
            console.log('✅ Socket.IO connected!');
            connected = true;
            
            // Send test message after connection
            setTimeout(() => {
                console.log('📤 Sending test message...');
                
                const testMessage = {
                    message: 'Hello! This is a test message. Please respond with "AI Assistant is working correctly!"',
                    projectHypothesisId: hypothesisId,
                    projectId: projectId,
                    messageType: 'ABOUT_LEAN_CANVAS',
                    wantToChangeInfo: false,
                };
                
                console.log('   Message type: ABOUT_LEAN_CANVAS');
                console.log('   Project ID:', projectId);
                console.log('   Hypothesis ID:', hypothesisId);
                
                socket.emit('createMessage', testMessage);
            }, 2000);
        });
        
        socket.on('answerCreated', (data) => {
            clearTimeout(timeout);
            messageReceived = true;
            
            console.log('\n✅ Received answer from AI Assistant!');
            console.log('   Full response data:', JSON.stringify(data, null, 2));
            console.log('   Answer length:', data?.message?.length || 0, 'characters');
            console.log('   Answer preview:', data?.message?.substring(0, 200) || 'No message');
            
            socket.disconnect();
            
            if (!data?.message || data.message.length === 0) {
                reject(new Error('Received empty message from AI Assistant. Check backend logs.'));
            } else {
                resolve(data.message);
            }
        });
        
        socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.error('❌ Socket.IO connection error:', error.message);
            reject(error);
        });
        
        socket.on('error', (error) => {
            console.error('❌ Socket.IO error:', error);
        });
        
        socket.on('disconnect', (reason) => {
            console.log('🔌 Socket.IO disconnected:', reason);
        });
    });
}

// Main test function
async function runFullTest() {
    try {
        // Step 1: Login
        const token = await login();
        
        // Step 2: Get Projects
        const project = await getProjects(token);
        
        // Step 3: Get Hypotheses
        const hypothesis = await getHypotheses(token, project.id);
        
        if (!hypothesis.threadId) {
            console.warn('\n⚠️  WARNING: Hypothesis does not have threadId');
            console.warn('   Thread will be created automatically by the backend');
        }
        
        // Step 4: Test Socket.IO and Send Message
        const answer = await testSocketIOMessage(token, project.id, hypothesis.id);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED!');
        console.log('✅ AI Assistant is working correctly!');
        console.log('\n📊 Test Summary:');
        console.log('   ✅ Login: Success');
        console.log('   ✅ Get Projects: Success');
        console.log('   ✅ Get Hypotheses: Success');
        console.log('   ✅ Socket.IO Connection: Success');
        console.log('   ✅ Message Send: Success');
        console.log('   ✅ Message Receive: Success');
        console.log('\n💬 AI Response received:', answer ? 'Yes' : 'No');
        
        return true;
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('❌ TEST FAILED!');
        console.error('Error:', error.message);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Make sure backend is running on port 5001');
        console.error('   2. Check TEST_EMAIL and TEST_PASSWORD in .env');
        console.error('   3. Make sure you have at least one project and hypothesis');
        console.error('   4. Verify OpenAI API key is correctly set');
        console.error('   5. Check backend logs for more details');
        return false;
    }
}

// Run test
runFullTest()
    .then((success) => {
        process.exit(success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });

