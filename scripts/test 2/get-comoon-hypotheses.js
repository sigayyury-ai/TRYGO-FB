/**
 * Скрипт для получения детальной информации о гипотезах проекта COMOON
 */

const path = require('path');

// Add backend node_modules to require path
const backendNodeModules = path.join(__dirname, '../../TRYGO-Backend/node_modules');
require('module')._initPaths([backendNodeModules]);

// Load .env from backend
const dotenvPath = require.resolve('dotenv', { paths: [backendNodeModules] });
require(dotenvPath).config({ path: path.join(__dirname, '../../TRYGO-Backend/.env') });

// Require modules from backend
const fetchModule = require.resolve('node-fetch', { paths: [backendNodeModules] });
const fetch = require(fetchModule);

const GRAPHQL_URL = process.env.VITE_SERVER_URL || 'http://localhost:5001/graphql';
const TEST_EMAIL = 'sigayyury5@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '1237895aA';

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

// Login
async function login() {
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
    
    const data = await graphqlRequest(loginMutation, {
        input: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        },
    });
    
    if (!data.login || !data.login.token) {
        throw new Error('Логин не удался');
    }
    
    return data.login.token;
}

// Get Projects
async function getProjects(token) {
    const query = `
        query GetProjects {
            getProjects {
                id
                title
                generationStatus
            }
        }
    `;
    
    const data = await graphqlRequest(query, {}, token);
    return data.getProjects;
}

// Get Hypotheses
async function getHypotheses(token, projectId) {
    const query = `
        query GetProjectHypotheses($projectId: ID!) {
            getProjectHypotheses(projectId: $projectId) {
                id
                title
                description
                createdAt
            }
        }
    `;
    
    const data = await graphqlRequest(query, { projectId }, token);
    return data.getProjectHypotheses;
}

// Get Lean Canvas
async function getLeanCanvas(token, hypothesisId) {
    const query = `
        query GetHypothesesCore($projectHypothesisId: ID!) {
            getHypothesesCore(projectHypothesisId: $projectHypothesisId) {
                id
                problems
                customerSegments {
                    id
                    name
                    description
                }
                uniqueProposition
                solutions
                keyMetrics
                channels {
                    channelType
                    variants {
                        name
                        url
                    }
                }
                costStructure
                revenueStream
                unfairAdvantages
            }
        }
    `;
    
    const data = await graphqlRequest(query, { projectHypothesisId: hypothesisId }, token);
    return data.getHypothesesCore;
}

// Main function
async function main() {
    try {
        console.log('📋 Получение информации о гипотезах проекта COMOON\n');
        console.log('='.repeat(80));
        
        // Login
        const token = await login();
        
        // Get projects
        const projects = await getProjects(token);
        const comoonProject = projects.find(p => p.title.toLowerCase().includes('comoon'));
        
        if (!comoonProject) {
            console.error('❌ Проект COMOON не найден');
            process.exit(1);
        }
        
        console.log(`\n✅ Проект найден: ${comoonProject.title}`);
        console.log(`   ID: ${comoonProject.id}\n`);
        
        // Get hypotheses
        const hypotheses = await getHypotheses(token, comoonProject.id);
        
        console.log(`📊 Найдено гипотез: ${hypotheses.length}\n`);
        console.log('='.repeat(80));
        
        // Get details for each hypothesis
        for (let i = 0; i < hypotheses.length; i++) {
            const hypothesis = hypotheses[i];
            console.log(`\n${'='.repeat(80)}`);
            console.log(`\n💡 ГИПОТЕЗА ${i + 1}`);
            console.log('='.repeat(80));
            console.log(`\n📌 Название:`);
            console.log(`   ${hypothesis.title}`);
            console.log(`\n📝 Описание:`);
            console.log(`   ${hypothesis.description}`);
            console.log(`\n🆔 ID: ${hypothesis.id}`);
            console.log(`📅 Создана: ${new Date(hypothesis.createdAt).toLocaleString('ru-RU')}`);
            
            // Get Lean Canvas
            try {
                const leanCanvas = await getLeanCanvas(token, hypothesis.id);
                
                console.log(`\n📋 LEAN CANVAS:`);
                console.log(`   ID: ${leanCanvas.id}`);
                
                console.log(`\n   🔴 Проблемы (${leanCanvas.problems?.length || 0}):`);
                if (leanCanvas.problems && leanCanvas.problems.length > 0) {
                    leanCanvas.problems.forEach((problem, idx) => {
                        console.log(`      ${idx + 1}. ${problem}`);
                    });
                }
                
                console.log(`\n   👥 Сегменты клиентов (${leanCanvas.customerSegments?.length || 0}):`);
                if (leanCanvas.customerSegments && leanCanvas.customerSegments.length > 0) {
                    leanCanvas.customerSegments.forEach((segment, idx) => {
                        console.log(`      ${idx + 1}. ${segment.name}`);
                        console.log(`         ${segment.description}`);
                    });
                }
                
                console.log(`\n   ✨ Уникальное предложение:`);
                console.log(`      ${leanCanvas.uniqueProposition || 'Не указано'}`);
                
                console.log(`\n   💡 Решения (${leanCanvas.solutions?.length || 0}):`);
                if (leanCanvas.solutions && leanCanvas.solutions.length > 0) {
                    leanCanvas.solutions.forEach((solution, idx) => {
                        console.log(`      ${idx + 1}. ${solution}`);
                    });
                }
                
                console.log(`\n   📊 Ключевые метрики (${leanCanvas.keyMetrics?.length || 0}):`);
                if (leanCanvas.keyMetrics && leanCanvas.keyMetrics.length > 0) {
                    leanCanvas.keyMetrics.forEach((metric, idx) => {
                        console.log(`      ${idx + 1}. ${metric}`);
                    });
                }
                
                console.log(`\n   🚀 Каналы (${leanCanvas.channels?.length || 0}):`);
                if (leanCanvas.channels && leanCanvas.channels.length > 0) {
                    leanCanvas.channels.forEach((channel, idx) => {
                        console.log(`      ${idx + 1}. ${channel.channelType}`);
                        if (channel.variants && channel.variants.length > 0) {
                            channel.variants.forEach(variant => {
                                console.log(`         - ${variant.name}${variant.url ? ` (${variant.url})` : ''}`);
                            });
                        }
                    });
                }
                
                console.log(`\n   💰 Структура затрат:`);
                console.log(`      ${leanCanvas.costStructure || 'Не указано'}`);
                
                console.log(`\n   💵 Потоки доходов:`);
                console.log(`      ${leanCanvas.revenueStream || 'Не указано'}`);
                
                console.log(`\n   🎯 Несправедливые преимущества (${leanCanvas.unfairAdvantages?.length || 0}):`);
                if (leanCanvas.unfairAdvantages && leanCanvas.unfairAdvantages.length > 0) {
                    leanCanvas.unfairAdvantages.forEach((advantage, idx) => {
                        console.log(`      ${idx + 1}. ${advantage}`);
                    });
                }
                
            } catch (error) {
                console.log(`\n   ⚠️  Не удалось загрузить Lean Canvas: ${error.message}`);
            }
        }
        
        console.log(`\n${'='.repeat(80)}`);
        console.log(`\n✅ Получена информация о ${hypotheses.length} гипотезах\n`);
        
    } catch (error) {
        console.error('\n❌ Ошибка:', error.message);
        process.exit(1);
    }
}

main();

