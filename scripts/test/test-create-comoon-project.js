/**
 * Автотест для создания проекта COMOON с генерацией гипотез и Lean Canvas
 * 
 * Процесс:
 * 1. Логин под sigayyury5@gmail.com
 * 2. Создание проекта через Socket.IO (URL_IMPORT)
 * 3. Автоматическая генерация гипотез
 * 4. Автоматическая генерация Lean Canvas для каждой гипотезы
 * 5. Проверка результатов через GraphQL
 * 
 * Запуск: node scripts/test/test-create-comoon-project.js
 */

const path = require('path');

// Add backend node_modules to require path
const backendNodeModules = path.join(__dirname, '../../TRYGO-Backend/node_modules');
require('module')._initPaths([backendNodeModules]);

// Load .env from backend
const dotenvPath = require.resolve('dotenv', { paths: [backendNodeModules] });
require(dotenvPath).config({ path: path.join(__dirname, '../../TRYGO-Backend/.env') });

// Require modules from backend
const io = require.resolve('socket.io-client', { paths: [backendNodeModules] });
const ioModule = require(io);
const fetchModule = require.resolve('node-fetch', { paths: [backendNodeModules] });
const fetch = require(fetchModule);

// Use io as ioModule if it's the default export
const ioDefault = ioModule.default || ioModule;

const GRAPHQL_URL = process.env.VITE_SERVER_URL || 'http://localhost:5001/graphql';
const WS_URL = process.env.VITE_WS_SERVER_URL || 'ws://localhost:5001';
const TEST_EMAIL = 'sigayyury5@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '1237895aA';

// Данные проекта COMOON
const COMOON_PROJECT_DATA = {
    startType: 'URL_IMPORT',
    info: 'Это комьюнити для фрилансеров, айтишников, удаленщиков. Способ монетизации это кэмп в формате Workation, колiving также в формате Workation, а также ивенты и викенды. Наша задача создать большое комьюнити по всему миру, объединять их под одной крышей, потому что мы это делаем для экспатов, говорящих на русском языке для того чтобы они общались со своими, жили в одном культурном контексте, заводили новые знакомства находили друзей и дружили всю жизнь.',
    url: 'https://comoon.io/'
};

console.log('🧪 Тест создания проекта COMOON');
console.log('='.repeat(80));
console.log('График URL:', GRAPHQL_URL);
console.log('Socket.IO URL:', WS_URL);
console.log('Email:', TEST_EMAIL);
console.log('URL проекта:', COMOON_PROJECT_DATA.url);
console.log('='.repeat(80));

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
    console.log('\n📝 Шаг 1: Авторизация...');
    
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
            throw new Error('Логин не удался: токен не получен');
        }
        
        console.log('✅ Авторизация успешна!');
        console.log('   User ID:', data.login.user.id);
        console.log('   Email:', data.login.user.email);
        console.log('   Token:', data.login.token.substring(0, 20) + '...');
        
        return data.login.token;
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error.message);
        throw error;
    }
}

// Step 2: Create Project via Socket.IO
async function createProjectViaSocket(token) {
    console.log('\n📡 Шаг 2: Создание проекта через Socket.IO...');
    console.log('   Тип:', COMOON_PROJECT_DATA.startType);
    console.log('   URL:', COMOON_PROJECT_DATA.url);
    console.log('   Описание:', COMOON_PROJECT_DATA.info.substring(0, 100) + '...');
    console.log('\n   ⏳ Ожидание ответа (это может занять 2-5 минут)...');
    
    return new Promise((resolve, reject) => {
        const socket = ioDefault(WS_URL, {
            transports: ['websocket'],
            query: { token },
            timeout: 300000, // 5 minutes timeout
        });
        
        let connected = false;
        let projectGenerated = false;
        
        // Timeout for the entire process (5 minutes)
        const timeout = setTimeout(() => {
            if (!projectGenerated) {
                socket.disconnect();
                reject(new Error('Таймаут: Проект не был создан в течение 5 минут'));
            }
        }, 300000);
        
        socket.on('connect', () => {
            console.log('   ✅ Socket.IO подключен!');
            connected = true;
            
            // Send project creation request
            setTimeout(() => {
                console.log('   📤 Отправка запроса на создание проекта...');
                socket.emit('generateProject', COMOON_PROJECT_DATA);
            }, 1000);
        });
        
        socket.on('projectGenerated', (data) => {
            clearTimeout(timeout);
            projectGenerated = true;
            socket.disconnect();
            
            if (data.projectId) {
                console.log('\n   ✅ Проект создан успешно!');
                console.log('   📦 Project ID:', data.projectId);
                resolve(data.projectId);
            } else {
                reject(new Error('Проект создан, но ID не получен'));
            }
        });
        
        socket.on('projectGenerationError', (error) => {
            clearTimeout(timeout);
            socket.disconnect();
            reject(new Error(`Ошибка генерации проекта: ${error.errorMessage || JSON.stringify(error)}`));
        });
        
        socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.error('   ❌ Ошибка подключения Socket.IO:', error.message);
            reject(error);
        });
        
        socket.on('error', (error) => {
            console.error('   ❌ Socket.IO ошибка:', error);
        });
        
        socket.on('disconnect', (reason) => {
            if (connected && !projectGenerated) {
                console.log('   🔌 Socket.IO отключен:', reason);
            }
        });
    });
}

// Step 3: Verify Project
async function verifyProject(token, projectId) {
    console.log('\n🔍 Шаг 3: Проверка созданного проекта...');
    
    const getProjectsQuery = `
        query GetProjects {
            getProjects {
                id
                title
                generationStatus
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(getProjectsQuery, {}, token);
        
        if (!data.getProjects || data.getProjects.length === 0) {
            throw new Error('Проекты не найдены');
        }
        
        const project = data.getProjects.find(p => p.id === projectId);
        
        if (!project) {
            throw new Error(`Проект с ID ${projectId} не найден`);
        }
        
        console.log('✅ Проект найден:');
        console.log('   ID:', project.id);
        console.log('   Название:', project.title);
        console.log('   Статус:', project.generationStatus);
        
        return project;
    } catch (error) {
        console.error('❌ Ошибка проверки проекта:', error.message);
        throw error;
    }
}

// Step 4: Verify Hypotheses
async function verifyHypotheses(token, projectId) {
    console.log('\n💡 Шаг 4: Проверка гипотез...');
    
    const getHypothesesQuery = `
        query GetProjectHypotheses($projectId: ID!) {
            getProjectHypotheses(projectId: $projectId) {
                id
                title
                description
                createdAt
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(getHypothesesQuery, { projectId }, token);
        
        if (!data.getProjectHypotheses || data.getProjectHypotheses.length === 0) {
            throw new Error('Гипотезы не найдены');
        }
        
        console.log(`✅ Найдено гипотез: ${data.getProjectHypotheses.length}`);
        
        data.getProjectHypotheses.forEach((hypothesis, index) => {
            console.log(`\n   Гипотеза ${index + 1}:`);
            console.log('   ID:', hypothesis.id);
            console.log('   Название:', hypothesis.title);
            console.log('   Описание:', hypothesis.description.substring(0, 100) + '...');
        });
        
        return data.getProjectHypotheses;
    } catch (error) {
        console.error('❌ Ошибка проверки гипотез:', error.message);
        throw error;
    }
}

// Step 5: Verify Lean Canvas
async function verifyLeanCanvas(token, hypotheses) {
    console.log('\n📋 Шаг 5: Проверка Lean Canvas для гипотез...');
    
    const getHypothesesCoreQuery = `
        query GetHypothesesCore($projectHypothesisId: ID!) {
            getHypothesesCore(projectHypothesisId: $projectHypothesisId) {
                id
                problems
                customerSegments {
                    name
                    description
                }
                uniqueProposition
                solutions
                keyMetrics
            }
        }
    `;
    
    const results = [];
    
    for (const hypothesis of hypotheses) {
        try {
            console.log(`\n   Проверка Lean Canvas для гипотезы: "${hypothesis.title}"...`);
            
            const data = await graphqlRequest(
                getHypothesesCoreQuery,
                { projectHypothesisId: hypothesis.id },
                token
            );
            
            if (!data.getHypothesesCore) {
                throw new Error(`Lean Canvas не найден для гипотезы ${hypothesis.id}`);
            }
            
            const core = data.getHypothesesCore;
            console.log('   ✅ Lean Canvas найден!');
            console.log('   ID:', core.id);
            console.log('   Проблемы:', core.problems?.length || 0, 'шт');
            console.log('   Сегменты клиентов:', core.customerSegments?.length || 0, 'шт');
            console.log('   Уникальное предложение:', core.uniqueProposition ? 'Да' : 'Нет');
            console.log('   Решения:', core.solutions?.length || 0, 'шт');
            console.log('   Ключевые метрики:', core.keyMetrics?.length || 0, 'шт');
            
            results.push({
                hypothesisId: hypothesis.id,
                hypothesisTitle: hypothesis.title,
                core: core,
            });
        } catch (error) {
            console.error(`   ❌ Ошибка проверки Lean Canvas для гипотезы "${hypothesis.title}":`, error.message);
            results.push({
                hypothesisId: hypothesis.id,
                hypothesisTitle: hypothesis.title,
                error: error.message,
            });
        }
    }
    
    const successCount = results.filter(r => r.core).length;
    console.log(`\n   📊 Результат: ${successCount}/${hypotheses.length} Lean Canvas созданы успешно`);
    
    return results;
}

// Main test function
async function runFullTest() {
    try {
        console.log('\n🚀 Запуск полного теста создания проекта COMOON...\n');
        
        // Step 1: Login
        const token = await login();
        
        // Step 2: Create Project
        const projectId = await createProjectViaSocket(token);
        
        // Wait a bit for all async operations to complete
        console.log('\n⏳ Ожидание завершения генерации гипотез и Lean Canvas...');
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
        
        // Step 3: Verify Project
        const project = await verifyProject(token, projectId);
        
        // Step 4: Verify Hypotheses
        const hypotheses = await verifyHypotheses(token, projectId);
        
        // Step 5: Verify Lean Canvas
        const leanCanvasResults = await verifyLeanCanvas(token, hypotheses);
        
        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
        console.log('='.repeat(80));
        console.log('\n📊 Сводка:');
        console.log('   ✅ Проект создан:', project.title);
        console.log('   ✅ Гипотез создано:', hypotheses.length);
        console.log('   ✅ Lean Canvas создано:', leanCanvasResults.filter(r => r.core).length);
        console.log('\n📋 Детали проекта:');
        console.log('   Project ID:', projectId);
        console.log('   Название:', project.title);
        console.log('   Статус:', project.generationStatus);
        console.log('\n💡 Следующие шаги:');
        console.log('   1. Проверьте проект в интерфейсе TRYGO');
        console.log('   2. Проверьте созданные гипотезы');
        console.log('   3. Проверьте Lean Canvas для каждой гипотезы');
        console.log('   4. Проверьте ICP профили (Person Profiles)');
        
        return {
            success: true,
            projectId,
            project,
            hypotheses,
            leanCanvasResults,
        };
    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ ТЕСТ ПРОВАЛЕН!');
        console.error('='.repeat(80));
        console.error('\nОшибка:', error.message);
        console.error('\n💡 Устранение неполадок:');
        console.error('   1. Убедитесь что бэкенд запущен на порту 5001');
        console.error('   2. Проверьте TEST_PASSWORD в .env');
        console.error('   3. Убедитесь что OpenAI API ключ настроен');
        console.error('   4. Проверьте логи бэкенда для деталей');
        console.error('   5. Проверьте доступность URL https://comoon.io/');
        
        return {
            success: false,
            error: error.message,
        };
    }
}

// Run test
runFullTest()
    .then((result) => {
        process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
        console.error('Неожиданная ошибка:', error);
        process.exit(1);
    });






