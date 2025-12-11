/**
 * Скрипт для добавления семантических кластеров из CSV файла
 * 
 * Использование:
 * node scripts/add-semantic-clusters.js <projectId> <hypothesisId> [csvFilePath]
 * 
 * Пример:
 * node scripts/add-semantic-clusters.js 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012 "tmp/TRYGO семантика - Main page.csv"
 */

const path = require('path');
const fs = require('fs');

// Add backend node_modules to require path
const backendNodeModules = path.join(__dirname, '../TRYGO-Backend/node_modules');
require('module')._initPaths([backendNodeModules]);

// Load .env from backend
const dotenvPath = require.resolve('dotenv', { paths: [backendNodeModules] });
require(dotenvPath).config({ path: path.join(__dirname, '../TRYGO-Backend/.env') });

// Require modules from backend
const fetchModule = require.resolve('node-fetch', { paths: [backendNodeModules] });
const fetch = require(fetchModule);


// Используем TRYGO-Backend endpoint (порт 5001)
const GRAPHQL_URL = process.env.VITE_SERVER_URL || 'http://localhost:5001/graphql';
const TEST_EMAIL = process.env.TEST_EMAIL || 'sigayyury5@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '1237895aA';

// Типы интентов
const SeoClusterIntent = {
  COMMERCIAL: 'COMMERCIAL',
  TRANSACTIONAL: 'TRANSACTIONAL',
  INFORMATIONAL: 'INFORMATIONAL',
  NAVIGATIONAL: 'NAVIGATIONAL',
};

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
  console.log('\n📝 Авторизация...');
  
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
    
    return { token: data.login.token, userId: data.login.user.id };
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error.message);
    throw error;
  }
}

// Парсинг CSV файла
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const keywords = [];
  const seenKeywords = new Set(); // Для дедупликации
  
  // Пропускаем заголовок
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Парсим CSV (учитываем запятые в значениях)
    // Формат: keyword,volume,competition
    const parts = line.split(',').map(p => p.trim());
    const keyword = parts[0];
    
    if (!keyword || keyword === '' || keyword.startsWith(',')) continue;
    
    // Дедупликация
    const keywordLower = keyword.toLowerCase();
    if (seenKeywords.has(keywordLower)) {
      continue;
    }
    seenKeywords.add(keywordLower);
    
    const volume = parts[1] ? parseFloat(parts[1]) : 0;
    const competition = parts[2] || '';
    
    keywords.push({
      keyword: keyword.trim(),
      volume: isNaN(volume) ? 0 : volume,
      competition: competition,
    });
  }
  
  return keywords;
}

// Определение интента на основе ключевого слова
function determineIntent(keyword) {
  const kw = keyword.toLowerCase();
  
  // Транзакционные - покупка, заказ, купить
  if (kw.includes('buy') || kw.includes('purchase') || kw.includes('order') || 
      kw.includes('купить') || kw.includes('заказать') || kw.includes('цена') ||
      kw.includes('price') || kw.includes('cost') || kw.includes('стоимость')) {
    return SeoClusterIntent.TRANSACTIONAL;
  }
  
  // Навигационные - поиск конкретного бренда/сайта
  if (kw.includes('trygo') || kw.includes('login') || kw.includes('sign in') ||
      kw.includes('вход') || kw.includes('войти')) {
    return SeoClusterIntent.NAVIGATIONAL;
  }
  
  // Информационные - как, что, почему, руководство
  if (kw.includes('how to') || kw.includes('what is') || kw.includes('why') ||
      kw.includes('guide') || kw.includes('tutorial') || kw.includes('learn') ||
      kw.includes('как') || kw.includes('что такое') || kw.includes('почему') ||
      kw.includes('руководство') || kw.includes('обучение')) {
    return SeoClusterIntent.INFORMATIONAL;
  }
  
  // По умолчанию - коммерческие (инструменты, платформы, стратегии)
  return SeoClusterIntent.COMMERCIAL;
}

// Кластеризация ключевых слов
function clusterKeywords(keywords) {
  const clusters = [];
  const usedKeywords = new Set();
  
  // Кластер 1: Marketing Strategy & Frameworks
  const strategyKeywords = keywords.filter(kw => 
    kw.keyword.toLowerCase().includes('strategy') || 
    kw.keyword.toLowerCase().includes('framework') ||
    kw.keyword.toLowerCase().includes('gtm')
  );
  
  if (strategyKeywords.length > 0) {
    clusters.push({
      title: 'Marketing Strategy & Frameworks',
      intent: SeoClusterIntent.COMMERCIAL,
      keywords: strategyKeywords.map(k => k.keyword),
    });
    strategyKeywords.forEach(k => usedKeywords.add(k.keyword));
  }
  
  // Кластер 2: AI Marketing Tools & Platforms
  const aiKeywords = keywords.filter(kw => 
    (kw.keyword.toLowerCase().includes('ai') || 
     kw.keyword.toLowerCase().includes('artificial intelligence')) &&
    !usedKeywords.has(kw.keyword)
  );
  
  if (aiKeywords.length > 0) {
    clusters.push({
      title: 'AI Marketing Tools & Platforms',
      intent: SeoClusterIntent.COMMERCIAL,
      keywords: aiKeywords.map(k => k.keyword),
    });
    aiKeywords.forEach(k => usedKeywords.add(k.keyword));
  }
  
  // Кластер 3: Marketing Automation
  const automationKeywords = keywords.filter(kw => 
    kw.keyword.toLowerCase().includes('automation') &&
    !usedKeywords.has(kw.keyword)
  );
  
  if (automationKeywords.length > 0) {
    clusters.push({
      title: 'Marketing Automation',
      intent: SeoClusterIntent.COMMERCIAL,
      keywords: automationKeywords.map(k => k.keyword),
    });
    automationKeywords.forEach(k => usedKeywords.add(k.keyword));
  }
  
  // Кластер 4: Marketing Workspace & Copilot
  const workspaceKeywords = keywords.filter(kw => 
    (kw.keyword.toLowerCase().includes('workspace') ||
     kw.keyword.toLowerCase().includes('copilot') ||
     kw.keyword.toLowerCase().includes('assistant')) &&
    !usedKeywords.has(kw.keyword)
  );
  
  if (workspaceKeywords.length > 0) {
    clusters.push({
      title: 'Marketing Workspace & Copilot',
      intent: SeoClusterIntent.COMMERCIAL,
      keywords: workspaceKeywords.map(k => k.keyword),
    });
    workspaceKeywords.forEach(k => usedKeywords.add(k.keyword));
  }
  
  // Кластер 5: Marketing for Startups
  const startupKeywords = keywords.filter(kw => 
    kw.keyword.toLowerCase().includes('startup') &&
    !usedKeywords.has(kw.keyword)
  );
  
  if (startupKeywords.length > 0) {
    clusters.push({
      title: 'Marketing for Startups',
      intent: SeoClusterIntent.COMMERCIAL,
      keywords: startupKeywords.map(k => k.keyword),
    });
    startupKeywords.forEach(k => usedKeywords.add(k.keyword));
  }
  
  // Остальные ключевые слова - общий кластер
  const remainingKeywords = keywords.filter(kw => !usedKeywords.has(kw.keyword));
  
  if (remainingKeywords.length > 0) {
    clusters.push({
      title: 'General Marketing',
      intent: SeoClusterIntent.COMMERCIAL,
      keywords: remainingKeywords.map(k => k.keyword),
    });
  }
  
  return clusters;
}

// Создание кластера
async function createCluster(token, projectId, hypothesisId, cluster) {
  const mutation = `
    mutation CreateSeoAgentCluster($projectId: ID!, $hypothesisId: ID, $input: SeoAgentClusterInput!) {
      createSeoAgentCluster(projectId: $projectId, hypothesisId: $hypothesisId, input: $input) {
        id
        title
        intent
        keywords
        createdAt
      }
    }
  `;
  
  try {
    const data = await graphqlRequest(
      mutation,
      {
        projectId,
        hypothesisId: hypothesisId || null,
        input: {
          title: cluster.title,
          intent: cluster.intent,
          keywords: cluster.keywords,
        },
      },
      token
    );
    
    return data.createSeoAgentCluster;
  } catch (error) {
    console.error(`❌ Ошибка создания кластера "${cluster.title}":`, error.message);
    throw error;
  }
}


// Главная функция
async function main() {
  const projectId = process.argv[2];
  const hypothesisId = process.argv[3];
  const csvFilePath = process.argv[4] || path.join(__dirname, '../tmp/TRYGO семантика - Main page.csv');
  
  if (!projectId || !hypothesisId) {
    console.error('❌ Ошибка: необходимо указать projectId и hypothesisId');
    console.log('Использование: node scripts/add-semantic-clusters.js <projectId> <hypothesisId> [csvFilePath]');
    process.exit(1);
  }
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Ошибка: файл не найден: ${csvFilePath}`);
    process.exit(1);
  }
  
  console.log('🚀 Добавление семантических кластеров из CSV');
  console.log('='.repeat(80));
  console.log('Project ID:', projectId);
  console.log('Hypothesis ID:', hypothesisId);
  console.log('CSV File:', csvFilePath);
  console.log('GraphQL URL:', GRAPHQL_URL);
  
  try {
    // Авторизация
    const { token, userId } = await login();
    console.log('User ID:', userId);
    
    // Парсинг CSV
    console.log('\n📖 Парсинг CSV файла...');
    const keywords = parseCSV(csvFilePath);
    console.log(`✅ Найдено ${keywords.length} ключевых слов`);
    
    // Вывод ключевых слов
    console.log('\n📋 Ключевые слова:');
    keywords.forEach((kw, idx) => {
      console.log(`   ${idx + 1}. ${kw.keyword} (Volume: ${kw.volume}, Competition: ${kw.competition || 'N/A'})`);
    });
    
    // Кластеризация
    console.log('\n🔍 Кластеризация ключевых слов...');
    const clusters = clusterKeywords(keywords);
    console.log(`✅ Создано ${clusters.length} кластеров`);
    
    // Вывод кластеров
    console.log('\n📊 Кластеры:');
    clusters.forEach((cluster, idx) => {
      console.log(`\n   ${idx + 1}. ${cluster.title} (${cluster.intent})`);
      console.log(`      Ключевые слова (${cluster.keywords.length}):`);
      cluster.keywords.forEach(kw => {
        console.log(`         - ${kw}`);
      });
    });
    
    // Создание кластеров в базе
    console.log('\n💾 Создание кластеров в базе данных...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const cluster of clusters) {
      try {
        const created = await createCluster(token, projectId, hypothesisId, cluster);
        console.log(`✅ Создан кластер: "${cluster.title}" (${cluster.keywords.length} ключевых слов)`);
        successCount++;
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Ошибка: "${cluster.title}" - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 Результаты:');
    console.log(`   ✅ Успешно создано: ${successCount}`);
    console.log(`   ❌ Ошибок: ${errorCount}`);
    console.log(`   📊 Всего кластеров: ${clusters.length}`);
    console.log(`   🔑 Всего ключевых слов: ${keywords.length}`);
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск
main().catch(console.error);

