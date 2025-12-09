/**
 * Автотест для флоу: Backlog → Plan → Content Generation
 * 
 * Процесс:
 * 1. Логин под sigayyury5@gmail.com
 * 2. Получение проекта COMOON
 * 3. Получение backlog items
 * 4. Выбор первого PENDING item из backlog
 * 5. Добавление item в план (обновление статуса на SCHEDULED)
 * 6. Проверка что item в плане (статус SCHEDULED)
 * 7. Подготовка структуры для генерации контента (когда API будет готов)
 * 
 * Запуск: node scripts/test/test-backlog-to-plan-flow.js
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

console.log('🧪 Тест флоу: Backlog → Plan → Content Generation');
console.log('='.repeat(80));
console.log('GraphQL URL:', GRAPHQL_URL);
console.log('Email:', TEST_EMAIL);

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
        
        return data.login.token;
    } catch (error) {
        console.error('❌ Ошибка авторизации:', error.message);
        throw error;
    }
}

// Step 2: Find Project with "Solo founders" Hypothesis
async function findProjectWithSoloFoundersHypothesis(token) {
    console.log('\n📁 Шаг 2: Поиск проекта с гипотезой "Solo founders"...');
    
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
        
        console.log(`   Найдено проектов: ${data.getProjects.length}`);
        
        // Search for "Solo founders" hypothesis in all projects
        for (const project of data.getProjects) {
            const getHypothesesQuery = `
                query GetProjectHypotheses($projectId: ID!) {
                    getProjectHypotheses(projectId: $projectId) {
                        id
                        title
                    }
                }
            `;
            
            try {
                const hypothesesData = await graphqlRequest(getHypothesesQuery, { projectId: project.id }, token);
                
                if (hypothesesData.getProjectHypotheses) {
                    const soloFoundersHypothesis = hypothesesData.getProjectHypotheses.find(h => 
                        h.title.toLowerCase().includes('solo founder')
                    );
                    
                    if (soloFoundersHypothesis) {
                        console.log('✅ Найден проект с гипотезой "Solo founders":');
                        console.log('   Проект ID:', project.id);
                        console.log('   Проект:', project.title);
                        console.log('   Гипотеза ID:', soloFoundersHypothesis.id);
                        console.log('   Гипотеза:', soloFoundersHypothesis.title);
                        
                        return {
                            project,
                            hypothesis: soloFoundersHypothesis,
                        };
                    }
                }
            } catch (err) {
                // Continue to next project if error
                console.log(`   ⚠️  Ошибка получения гипотез для проекта ${project.title}:`, err.message);
            }
        }
        
        // If not found, use COMOON project
        console.log('   ⚠️  Гипотеза "Solo founders" не найдена, используем проект COMOON');
        const comoonProject = data.getProjects.find(p => 
            p.title.toLowerCase().includes('comoon')
        );
        
        if (!comoonProject) {
            throw new Error('Проект COMOON не найден и гипотеза "Solo founders" не найдена');
        }
        
        console.log('✅ Используется проект COMOON:');
        console.log('   ID:', comoonProject.id);
        console.log('   Название:', comoonProject.title);
        
        return {
            project: comoonProject,
            hypothesis: null, // Will be found in step 3
        };
    } catch (error) {
        console.error('❌ Ошибка получения проекта:', error.message);
        throw error;
    }
}

// Step 3: Get Hypotheses (find "Solo founders")
async function getHypotheses(token, projectId) {
    console.log('\n💡 Шаг 3: Поиск гипотезы "Solo founders"...');
    
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
            throw new Error('Гипотезы не найдены');
        }
        
        // Find hypothesis with "Solo founders" in title
        const soloFoundersHypothesis = data.getProjectHypotheses.find(h => 
            h.title.toLowerCase().includes('solo founder')
        );
        
        if (!soloFoundersHypothesis) {
            console.log('⚠️  Гипотеза "Solo founders" не найдена, используем первую доступную');
            const hypothesis = data.getProjectHypotheses[0];
            console.log('✅ Используется гипотеза:');
            console.log('   ID:', hypothesis.id);
            console.log('   Название:', hypothesis.title);
            return hypothesis;
        }
        
        console.log('✅ Найдена гипотеза "Solo founders":');
        console.log('   ID:', soloFoundersHypothesis.id);
        console.log('   Название:', soloFoundersHypothesis.title);
        
        return soloFoundersHypothesis;
    } catch (error) {
        console.error('❌ Ошибка получения гипотез:', error.message);
        throw error;
    }
}

// Step 3.5: Create Test Backlog Item
async function createTestBacklogItem(token, projectId, hypothesisId) {
    console.log('\n📝 Создание тестового backlog item...');
    
    const createBacklogMutation = `
        mutation CreateSeoAgentBacklogIdea($projectId: ID!, $hypothesisId: ID, $input: SeoAgentBacklogIdeaInput!) {
            createSeoAgentBacklogIdea(projectId: $projectId, hypothesisId: $hypothesisId, input: $input) {
                id
                title
                description
                contentType
                status
                createdAt
                updatedAt
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(createBacklogMutation, {
            projectId,
            hypothesisId,
            input: {
                title: 'Тестовая статья: Как начать свой бизнес как Solo Founder',
                description: 'Статья о том, как начать свой бизнес в одиночку, без команды. Покрывает основные шаги, инструменты и стратегии для solo founders.',
                contentType: 'ARTICLE',
                status: 'PENDING',
            },
        }, token);
        
        const createdItem = data.createSeoAgentBacklogIdea;
        console.log('   ✅ Backlog item создан:', createdItem.title);
        
        return createdItem;
    } catch (error) {
        console.error('   ❌ Ошибка создания backlog item:', error.message);
        throw error;
    }
}

// Step 4: Get Backlog Items
async function getBacklogItems(token, projectId, hypothesisId) {
    console.log('\n📋 Шаг 4: Получение backlog items...');
    
    const getBacklogQuery = `
        query GetSeoAgentBacklog($projectId: ID!, $hypothesisId: ID) {
            seoAgentBacklog(projectId: $projectId, hypothesisId: $hypothesisId) {
                id
                title
                description
                contentType
                status
                clusterId
                createdAt
                updatedAt
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(getBacklogQuery, { 
            projectId, 
            hypothesisId 
        }, token);
        
        const backlogItems = data?.seoAgentBacklog || [];
        
        console.log(`✅ Найдено backlog items: ${backlogItems.length}`);
        
        if (backlogItems.length > 0) {
            const pendingItems = backlogItems.filter(item => item.status === 'PENDING');
            const scheduledItems = backlogItems.filter(item => item.status === 'SCHEDULED');
            
            console.log(`   PENDING: ${pendingItems.length}`);
            console.log(`   SCHEDULED: ${scheduledItems.length}`);
            
            if (pendingItems.length > 0) {
                console.log('\n   Первый PENDING item:');
                console.log('   ID:', pendingItems[0].id);
                console.log('   Название:', pendingItems[0].title);
                console.log('   Тип:', pendingItems[0].contentType);
            }
        }
        
        return backlogItems;
    } catch (error) {
        console.error('❌ Ошибка получения backlog:', error.message);
        throw error;
    }
}

// Step 5: Add Item to Plan (Update status to SCHEDULED)
async function addItemToPlan(token, backlogItem) {
    console.log('\n📅 Шаг 5: Добавление item в план (SCHEDULED)...');
    console.log(`   Item: "${backlogItem.title}"`);
    console.log(`   Текущий статус: ${backlogItem.status}`);
    
    const updateBacklogMutation = `
        mutation UpdateSeoAgentBacklogIdea($id: ID!, $input: SeoAgentBacklogIdeaInput!) {
            updateSeoAgentBacklogIdea(id: $id, input: $input) {
                id
                title
                status
                contentType
                updatedAt
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(updateBacklogMutation, {
            id: backlogItem.id,
            input: {
                title: backlogItem.title,
                description: backlogItem.description || undefined,
                contentType: backlogItem.contentType,
                status: 'SCHEDULED',
                clusterId: backlogItem.clusterId || undefined,
            },
        }, token);
        
        const updatedItem = data.updateSeoAgentBacklogIdea;
        
        console.log('✅ Item добавлен в план!');
        console.log('   Новый статус:', updatedItem.status);
        console.log('   Обновлен:', new Date(updatedItem.updatedAt).toLocaleString('ru-RU'));
        
        return updatedItem;
    } catch (error) {
        console.error('❌ Ошибка добавления в план:', error.message);
        throw error;
    }
}

// Step 6: Verify Item in Plan
async function verifyItemInPlan(token, projectId, hypothesisId, itemId) {
    console.log('\n✅ Шаг 6: Проверка item в плане...');
    
    const getBacklogQuery = `
        query GetSeoAgentBacklog($projectId: ID!, $hypothesisId: ID) {
            seoAgentBacklog(projectId: $projectId, hypothesisId: $hypothesisId) {
                id
                title
                status
            }
        }
    `;
    
    try {
        const data = await graphqlRequest(getBacklogQuery, { 
            projectId, 
            hypothesisId 
        }, token);
        
        const backlogItems = data?.seoAgentBacklog || [];
        const scheduledItem = backlogItems.find(item => item.id === itemId);
        
        if (!scheduledItem) {
            throw new Error('Item не найден в backlog');
        }
        
        if (scheduledItem.status !== 'SCHEDULED') {
            throw new Error(`Ожидался статус SCHEDULED, получен: ${scheduledItem.status}`);
        }
        
        console.log('✅ Item подтвержден в плане!');
        console.log('   Название:', scheduledItem.title);
        console.log('   Статус:', scheduledItem.status);
        
        return scheduledItem;
    } catch (error) {
        console.error('❌ Ошибка проверки:', error.message);
        throw error;
    }
}

// Step 7: Prepare for Content Generation (structure check)
async function prepareContentGeneration(token, scheduledItem, projectId, hypothesisId) {
    console.log('\n📝 Шаг 7: Подготовка к генерации контента...');
    
    // Check if content generation API exists
    const checkContentGenQuery = `
        query {
            __schema {
                mutationType {
                    fields {
                        name
                    }
                }
            }
        }
    `;
    
    try {
        const schemaData = await graphqlRequest(checkContentGenQuery, {}, token);
        const mutations = schemaData.__schema.mutationType.fields.map(f => f.name);
        
        console.log('   Доступные мутации:', mutations.length);
        
        // Check for content generation mutations
        const contentGenMutations = mutations.filter(name => 
            name.toLowerCase().includes('generate') || 
            name.toLowerCase().includes('content')
        );
        
        if (contentGenMutations.length > 0) {
            console.log('   ✅ Найдены мутации для генерации контента:');
            contentGenMutations.forEach(name => {
                console.log(`      - ${name}`);
            });
        } else {
            console.log('   ⚠️  Мутации для генерации контента еще не реализованы');
            console.log('   📌 Структура готова для будущей реализации');
        }
        
        console.log('\n   📋 Параметры для генерации контента:');
        console.log('      Project ID:', projectId);
        console.log('      Hypothesis ID:', hypothesisId);
        console.log('      Backlog Item ID:', scheduledItem.id);
        console.log('      Title:', scheduledItem.title);
        console.log('      Content Type:', scheduledItem.contentType);
        
        return {
            ready: contentGenMutations.length > 0,
            mutations: contentGenMutations,
            item: scheduledItem,
        };
    } catch (error) {
        console.warn('   ⚠️  Не удалось проверить схему:', error.message);
        return {
            ready: false,
            mutations: [],
            item: scheduledItem,
        };
    }
}

// Main test function
async function runFullTest() {
    try {
        console.log('\n🚀 Запуск теста флоу Backlog → Plan → Content Generation...\n');
        
        // Step 1: Login
        const token = await login();
        
        // Step 2: Find Project with Solo Founders Hypothesis
        const { project, hypothesis: foundHypothesis } = await findProjectWithSoloFoundersHypothesis(token);
        
        // Step 3: Get Hypotheses (if not already found)
        const hypothesis = foundHypothesis || await getHypotheses(token, project.id);
        
        // Step 4: Get Backlog Items
        const backlogItems = await getBacklogItems(token, project.id, hypothesis.id);
        
        if (backlogItems.length === 0) {
            console.log('\n⚠️  Backlog пуст. Создание тестового backlog item...');
            const testBacklogItem = await createTestBacklogItem(
                token, 
                project.id, 
                hypothesis.id
            );
            backlogItems.push(testBacklogItem);
            console.log('✅ Тестовый backlog item создан:', testBacklogItem.title);
        }
        
        // Find PENDING item
        const pendingItem = backlogItems.find(item => item.status === 'PENDING');
        
        if (!pendingItem) {
            console.log('\n⚠️  Нет PENDING items в backlog');
            console.log('   Попытка использовать SCHEDULED item для тестирования генерации...');
            
            const scheduledItem = backlogItems.find(item => item.status === 'SCHEDULED');
            if (scheduledItem) {
                console.log('   ✅ Используем SCHEDULED item для теста генерации контента');
                const contentGenResult = await prepareContentGeneration(
                    token, 
                    scheduledItem, 
                    project.id, 
                    hypothesis.id
                );
                
                console.log('\n' + '='.repeat(80));
                console.log('✅ ТЕСТ ЗАВЕРШЕН (использован существующий SCHEDULED item)');
                console.log('='.repeat(80));
                return { success: true, usedExisting: true };
            } else {
                throw new Error('Нет доступных items для тестирования (нет PENDING и SCHEDULED)');
            }
        }
        
        // Step 5: Add Item to Plan
        const scheduledItem = await addItemToPlan(token, pendingItem);
        
        // Wait a bit for state to sync
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 6: Verify Item in Plan
        await verifyItemInPlan(token, project.id, hypothesis.id, scheduledItem.id);
        
        // Step 7: Prepare for Content Generation
        const contentGenResult = await prepareContentGeneration(
            token, 
            scheduledItem, 
            project.id, 
            hypothesis.id
        );
        
        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!');
        console.log('='.repeat(80));
        console.log('\n📊 Сводка:');
        console.log('   ✅ Авторизация: Успешно');
        console.log('   ✅ Проект найден:', project.title);
        console.log('   ✅ Гипотеза найдена:', hypothesis.title);
        console.log('   ✅ Backlog items получены:', backlogItems.length);
        console.log('   ✅ Item добавлен в план:', scheduledItem.title);
        console.log('   ✅ Статус обновлен: PENDING → SCHEDULED');
        console.log('   ✅ Генерация контента:', contentGenResult.ready ? 'API готов' : 'API будет добавлен позже');
        
        console.log('\n💡 Следующие шаги:');
        console.log('   1. Item находится в плане (статус SCHEDULED)');
        console.log('   2. Можно проверить в интерфейсе TRYGO на странице SEO Agent → Plan');
        console.log('   3. Генерация контента:', contentGenResult.ready 
            ? 'готово к использованию' 
            : 'будет реализована позже');
        
        return {
            success: true,
            projectId: project.id,
            hypothesisId: hypothesis.id,
            backlogItemId: scheduledItem.id,
            contentGenerationReady: contentGenResult.ready,
        };
    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌ ТЕСТ ПРОВАЛЕН!');
        console.error('='.repeat(80));
        console.error('\nОшибка:', error.message);
        console.error('\n💡 Устранение неполадок:');
        console.error('   1. Убедитесь что бэкенд запущен на порту 5001');
        console.error('   2. Убедитесь что проект COMOON существует');
        console.error('   3. Убедитесь что в backlog есть PENDING items');
        console.error('   4. Проверьте логи бэкенда для деталей');
        
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

