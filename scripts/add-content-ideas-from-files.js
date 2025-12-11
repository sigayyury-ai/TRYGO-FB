/**
 * Скрипт для добавления идей контента из файлов в базу данных
 * 
 * Использование:
 * node scripts/add-content-ideas-from-files.js [projectId] [hypothesisId]
 * 
 * Если projectId не указан, скрипт покажет список доступных проектов и предложит выбрать.
 * 
 * Примеры:
 * node scripts/add-content-ideas-from-files.js
 * node scripts/add-content-ideas-from-files.js 507f1f77bcf86cd799439011
 * node scripts/add-content-ideas-from-files.js 507f1f77bcf86cd799439011 507f1f77bcf86cd799439012
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

// Используем TRYGO-Backend (порт 5001) для авторизации
const TRYGO_BACKEND_GRAPHQL_URL = process.env.VITE_SERVER_URL || 'http://localhost:5001/graphql';
// Используем backend (порт 4100) для createCustomContentIdea
const BACKEND_GRAPHQL_URL = process.env.BACKEND_GRAPHQL_URL || 'http://localhost:4100/graphql';
const TEST_EMAIL = process.env.TEST_EMAIL || 'sigayyury5@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '1237895aA';

// Категории контента
const ContentCategory = {
  PAINS: 'PAINS',
  GOALS: 'GOALS',
  TRIGGERS: 'TRIGGERS',
  PRODUCT_FEATURES: 'PRODUCT_FEATURES',
  BENEFITS: 'BENEFITS',
  FAQS: 'FAQS',
  INFORMATIONAL: 'INFORMATIONAL',
};

const ContentIdeaType = {
  ARTICLE: 'ARTICLE',
  COMMERCIAL_PAGE: 'COMMERCIAL_PAGE',
  LANDING_PAGE: 'LANDING_PAGE',
};

// Маппинг ключевых слов к категориям
function determineCategory(title, description, feature) {
  const text = `${title} ${description || ''} ${feature || ''}`.toLowerCase();
  
  // FAQ статьи
  if (text.includes('faq') || text.includes('question') || text.includes('вопрос') ||
      (text.includes('как') && (text.includes('что') || text.includes('когда') || text.includes('почему')))) {
    return ContentCategory.FAQS;
  }
  
  // Product Features (коммерческие страницы) - демонстрация фич TRYGO
  if (text.includes('trygo') && (text.includes('генерирует') || text.includes('generates') || 
      text.includes('создает') || text.includes('creates') || text.includes('помогает') ||
      text.includes('helps') || text.includes('works'))) {
    return ContentCategory.PRODUCT_FEATURES;
  }
  
  if (text.includes('feature') || text.includes('фича') || text.includes('возможность') ||
      text.includes('tool') || text.includes('инструмент') || text.includes('generator') ||
      text.includes('builder') || text.includes('manager') || text.includes('analyzer') ||
      text.includes('playbook') || text.includes('accelerator') || text.includes('finder') ||
      text.includes('processor') || text.includes('discovery')) {
    return ContentCategory.PRODUCT_FEATURES;
  }
  
  // Benefits (коммерческие страницы)
  if (text.includes('benefit') || text.includes('преимущество') || text.includes('выгода') ||
      text.includes('advantage') || text.includes('value') || text.includes('ценность') ||
      text.includes('результат') || text.includes('result') || text.includes('outcome')) {
    return ContentCategory.BENEFITS;
  }
  
  // Pains - статьи о проблемах
  if (text.includes('pain') || text.includes('проблема') || text.includes('боль') ||
      text.includes('challenge') || text.includes('difficulty') || text.includes('issue') ||
      text.includes('problem') || text.includes('риск') || text.includes('risk') ||
      text.includes('ошибка') || text.includes('mistake') || text.includes('fail')) {
    return ContentCategory.PAINS;
  }
  
  // Goals - статьи о целях и достижениях
  if (text.includes('goal') || text.includes('цель') || text.includes('задача') ||
      text.includes('achieve') || text.includes('достичь') || text.includes('успех') ||
      text.includes('success') || text.includes('результат') || text.includes('result') ||
      text.includes('как достичь') || text.includes('how to achieve')) {
    return ContentCategory.GOALS;
  }
  
  // Triggers - статьи о событиях и запусках
  if (text.includes('trigger') || text.includes('триггер') || text.includes('событие') ||
      text.includes('event') || text.includes('launch') || text.includes('запуск') ||
      text.includes('start') || text.includes('начало') || text.includes('onboarding')) {
    return ContentCategory.TRIGGERS;
  }
  
  // По умолчанию - информационные статьи
  return ContentCategory.INFORMATIONAL;
}

// Определение типа контента
function determineContentType(title, description, feature) {
  const text = `${title} ${description || ''} ${feature || ''}`.toLowerCase();
  
  // Коммерческие страницы - демонстрация фич TRYGO
  if (text.includes('landing page') || text.includes('landing pages') ||
      text.includes('лендинг') || text.includes('лендинг-страница')) {
    return ContentIdeaType.LANDING_PAGE;
  }
  
  // Коммерческие страницы - про фичи и преимущества
  if (text.includes('commercial') || text.includes('коммерческая') ||
      (text.includes('trygo') && (text.includes('в') || text.includes('в trygo') || 
       text.includes('how') || text.includes('как')))) {
    return ContentIdeaType.COMMERCIAL_PAGE;
  }
  
  // Статьи по умолчанию
  return ContentIdeaType.ARTICLE;
}

// GraphQL helper
async function graphqlRequest(query, variables = {}, token = null, url = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Используем указанный URL или TRYGO-Backend по умолчанию
  const graphqlUrl = url || TRYGO_BACKEND_GRAPHQL_URL;
  
  const response = await fetch(graphqlUrl, {
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
    
    return data.login.token;
  } catch (error) {
    console.error('❌ Ошибка авторизации:', error.message);
    throw error;
  }
}

// Получение списка проектов
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
  
  try {
    const data = await graphqlRequest(query, {}, token);
    return data.getProjects || [];
  } catch (error) {
    console.error('❌ Ошибка получения проектов:', error.message);
    throw error;
  }
}

// Получение гипотез проекта
async function getHypotheses(token, projectId) {
  const query = `
    query GetProjectHypotheses($projectId: ID!) {
      getProjectHypotheses(projectId: $projectId) {
        id
        title
      }
    }
  `;
  
  try {
    const data = await graphqlRequest(query, { projectId }, token);
    return data.getProjectHypotheses || [];
  } catch (error) {
    console.error('❌ Ошибка получения гипотез:', error.message);
    return [];
  }
}

// Выбор проекта интерактивно
async function selectProject(token) {
  console.log('\n📁 Получение списка проектов...');
  const projects = await getProjects(token);
  
  if (projects.length === 0) {
    throw new Error('Проекты не найдены. Создайте проект перед добавлением идей.');
  }
  
  console.log('\n📋 Доступные проекты:');
  projects.forEach((project, index) => {
    console.log(`   ${index + 1}. ${project.title} (ID: ${project.id})`);
  });
  
  // Используем первый проект по умолчанию
  const selectedProject = projects[0];
  console.log(`\n✅ Используется первый проект: "${selectedProject.title}" (ID: ${selectedProject.id})`);
  
  // Показываем гипотезы, если есть
  const hypotheses = await getHypotheses(token, selectedProject.id);
  if (hypotheses.length > 0) {
    console.log(`\n💡 Найдено гипотез: ${hypotheses.length}`);
    hypotheses.slice(0, 3).forEach(h => {
      console.log(`   - ${h.title} (ID: ${h.id})`);
    });
    if (hypotheses.length > 3) {
      console.log(`   ... и еще ${hypotheses.length - 3}`);
    }
  }
  
  return {
    project: selectedProject,
    hypotheses,
  };
}

// Создание идеи контента через createCustomContentIdea (сохраняет в SeoContentItem)
async function createContentIdea(token, projectId, hypothesisId, idea) {
  // Маппинг категорий
  const categoryMap = {
    'PAINS': 'PAINS',
    'GOALS': 'GOALS',
    'TRIGGERS': 'TRIGGERS',
    'PRODUCT_FEATURES': 'PRODUCT_FEATURES',
    'BENEFITS': 'BENEFITS',
    'FAQS': 'FAQS',
    'INFORMATIONAL': 'INFORMATIONAL',
  };
  
  const mutation = `
    mutation CreateCustomContentIdea($input: CreateCustomContentIdeaInput!) {
      createCustomContentIdea(input: $input) {
        id
        projectId
        hypothesisId
        title
        description
        category
        contentType
        clusterId
        status
        dismissed
        createdAt
        updatedAt
      }
    }
  `;
  
  try {
    // Используем backend (4100) для createCustomContentIdea
    const data = await graphqlRequest(
      mutation,
      {
        input: {
          projectId,
          hypothesisId: hypothesisId || '69387a92ef08390214f02419',  // Используем переданный hypothesisId или дефолтный
          title: idea.title,
          description: idea.description || null,
          category: categoryMap[idea.category] || 'INFORMATIONAL',
          contentType: idea.contentType || 'ARTICLE',
          clusterId: idea.clusterId || null,
        },
      },
      token,
      BACKEND_GRAPHQL_URL  // Используем backend для создания идей
    );
    
    return data.createCustomContentIdea;
  } catch (error) {
    console.error(`❌ Ошибка создания идеи "${idea.title}":`, error.message);
    if (error.message.includes('GraphQL Error')) {
      console.error(`   Детали ошибки:`, error.message);
    }
    throw error;
  }
}

// Парсинг одного файла
function parseFile(filePath, sourceName) {
  const ideas = [];
  
  if (!fs.existsSync(filePath)) {
    return ideas;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  let currentIdea = null;
  let inIdeasSection = false;
  let sectionDepth = 0;
  let skipSections = false; // Для seo-content-expansion-old.md пропускаем только секцию "12 идей"
  
  // Для seo-content-expansion-old.md парсим все секции, кроме основной "12 идей"
  const isOldFile = sourceName.includes('seo-content-expansion-old.md');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Для старого файла: пропускаем основную секцию "12 идей", но парсим остальные
    if (isOldFile && trimmed.includes('## 🎯 12 идей контента по фичам TRYGO')) {
      skipSections = true;
      continue;
    }
    
    // Для старого файла: начинаем парсить после секции "12 идей"
    if (isOldFile && skipSections && trimmed.startsWith('## ') && !trimmed.includes('12 идей')) {
      skipSections = false;
      inIdeasSection = true;
      sectionDepth = (line.match(/^#+/)?.[0]?.length || 0);
      continue;
    }
    
    // Определяем начало секции с идеями
    if (!isOldFile && (trimmed.includes('идей контента') || trimmed.includes('идеи контента') || 
        trimmed.includes('идеи для блога') || trimmed.includes('идеи по фичам'))) {
      inIdeasSection = true;
      sectionDepth = (line.match(/^#+/)?.[0]?.length || 0);
      continue;
    }
    
    // Для старого файла: парсим все секции после "12 идей"
    if (isOldFile && !skipSections && trimmed.startsWith('##')) {
      inIdeasSection = true;
      sectionDepth = (line.match(/^#+/)?.[0]?.length || 0);
      continue;
    }
    
    // Выходим из секции, если встретили заголовок того же или более высокого уровня
    if (inIdeasSection && trimmed.startsWith('#')) {
      const currentDepth = (line.match(/^#+/)?.[0]?.length || 0);
      if (currentDepth <= sectionDepth && !trimmed.includes('идей') && !isOldFile) {
        inIdeasSection = false;
      }
    }
    
    if (!inIdeasSection || skipSections) continue;
    
    // Начало идеи (#### номер. "Заголовок" или #### "Заголовок")
    const ideaMatch = trimmed.match(/^####\s+(\d+\.\s*)?["'](.+?)["']/) || 
                      trimmed.match(/^####\s+(\d+\.\s*)?\*\*(.+?)\*\*/);
    
    // Для старого файла: также парсим идеи из списков (- "название")
    // Но только из конкретных секций с идеями, а не из метаданных
    const listIdeaMatch = isOldFile && trimmed.match(/^-\s*["'](.+?)["']/) ||
                          isOldFile && trimmed.match(/^\d+\.\s*["'](.+?)["']/);
    
    // Пропускаем секции с метаданными (ключевые слова, календари и т.д.)
    const skipMetaSections = isOldFile && (
      trimmed.includes('Keyword expansion') ||
      trimmed.includes('Internal linking strategy') ||
      trimmed.includes('User intent coverage') ||
      trimmed.includes('Monthly themes') ||
      trimmed.includes('Weekly content pillars') ||
      trimmed.includes('Content creation workflow') ||
      trimmed.includes('Success metrics')
    );
    
    if (skipMetaSections) {
      inIdeasSection = false;
      continue;
    }
    
    if (ideaMatch) {
      const title = (ideaMatch[2] || ideaMatch[3]).trim();
      // Пропускаем заголовки секций
      if (title.endsWith(':') || title.length < 10) {
        continue;
      }
      if (currentIdea && currentIdea.title) {
        ideas.push(currentIdea);
      }
      currentIdea = {
        title: title,
        description: '',
        feature: '',
        source: sourceName,
      };
    } else if (listIdeaMatch && listIdeaMatch[1] && !skipMetaSections) {
      const title = listIdeaMatch[1].trim();
      
      // Пропускаем инструменты, калькуляторы, шаблоны
      if (title.match(/(Calculator|Template|Checklist|Quiz|Tool|Estimator|Matrix|Kit|Schema|audit checklist)$/i)) {
        continue;
      }
      
      // Пропускаем слишком короткие, метаданные и неинформативные строки
      if (title.length < 15 || 
          title.match(/^(Шаблоны|Гайды|Инструменты|Серия|Курс|Глоссарий|Pillar|Related|Cross|Choose|Build|Share|Best|Customer success)/i) ||
          title.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Monday|Tuesday|Wednesday|Thursday|Friday)/i) ||
          title.match(/^(Informational|Navigational|Transactional|Commercial):/i) ||
          title.match(/^(Average|Most effective|Customer acquisition cost)/i) ||
          title.match(/^Thread:/i) ||
          title.match(/^Day in life/i) ||
          title.match(/^5-second/i)) {
        continue;
      }
      
      // Пропускаем названия недель из серий (Неделя 1, Неделя 2 и т.д.)
      if (title.match(/^Неделя \d+:/i)) {
        continue;
      }
      
      // Добавляем идеи из списков (для старого файла)
      if (currentIdea && currentIdea.title) {
        ideas.push(currentIdea);
      }
      currentIdea = {
        title: title,
        description: '',
        feature: '',
        source: sourceName,
      };
    }
    // Фича
    else if (trimmed.startsWith('**Фича:**') && currentIdea) {
      currentIdea.feature = trimmed.replace(/\*\*Фича:\*\*/g, '').trim();
    }
    // Контент
    else if (trimmed.startsWith('**Контент:**') && currentIdea) {
      currentIdea.description = trimmed.replace(/\*\*Контент:\*\*/g, '').trim();
    }
    // Бесплатный материал
    else if (trimmed.startsWith('**Бесплатный материал:**') && currentIdea) {
      const material = trimmed.replace(/\*\*Бесплатный материал:\*\*/g, '').trim();
      currentIdea.description = (currentIdea.description || '') + 
        (currentIdea.description ? ' ' : '') + `Бесплатный материал: ${material}`;
    }
    // Формат
    else if (trimmed.startsWith('**Формат:**') && currentIdea) {
      const format = trimmed.replace(/\*\*Формат:\*\*/g, '').trim();
      currentIdea.description = (currentIdea.description || '') + 
        (currentIdea.description ? ' ' : '') + `Формат: ${format}`;
    }
    // Ценность
    else if (trimmed.startsWith('**Ценность:**') && currentIdea) {
      const value = trimmed.replace(/\*\*Ценность:\*\*/g, '').trim();
      currentIdea.description = (currentIdea.description || '') + 
        (currentIdea.description ? ' ' : '') + `Ценность: ${value}`;
    }
    // CTA
    else if (trimmed.startsWith('**CTA:**') && currentIdea) {
      const cta = trimmed.replace(/\*\*CTA:\*\*/g, '').trim();
      currentIdea.description = (currentIdea.description || '') + 
        (currentIdea.description ? ' ' : '') + `CTA: ${cta}`;
    }
    // Продолжение описания (если строка не пустая и не начинается с **)
    else if (currentIdea && trimmed && !trimmed.startsWith('**') && 
             !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
      if (currentIdea.description && !currentIdea.description.endsWith('.')) {
        currentIdea.description += ' ' + trimmed;
      } else if (!currentIdea.description) {
        currentIdea.description = trimmed;
      }
    }
  }
  
  if (currentIdea && currentIdea.title) {
    ideas.push(currentIdea);
  }
  
  return ideas;
}

// Парсинг файлов с идеями
function parseIdeasFromFiles() {
  const ideas = [];
  const seenTitles = new Set(); // Для дедупликации
  
  // Файл 1: seo-content-expansion.md
  const file1 = path.join(__dirname, '../competitor analysis/strategy/seo-content-expansion.md');
  const ideas1 = parseFile(file1, 'seo-content-expansion.md');
  ideas1.forEach(idea => {
    if (!seenTitles.has(idea.title.toLowerCase())) {
      ideas.push(idea);
      seenTitles.add(idea.title.toLowerCase());
    }
  });
  
  // Файл 2: seo-content-expansion-temp.md
  const file2 = path.join(__dirname, '../competitor analysis/strategy/seo-content-expansion-temp.md');
  const ideas2 = parseFile(file2, 'seo-content-expansion-temp.md');
  ideas2.forEach(idea => {
    if (!seenTitles.has(idea.title.toLowerCase())) {
      ideas.push(idea);
      seenTitles.add(idea.title.toLowerCase());
    }
  });
  
  // Файл 3: seo-content-expansion-old.md (только основные идеи)
  const file3 = path.join(__dirname, '../competitor analysis/strategy/seo-content-expansion-old.md');
  const ideas3 = parseFile(file3, 'seo-content-expansion-old.md');
  ideas3.forEach(idea => {
    if (!seenTitles.has(idea.title.toLowerCase())) {
      ideas.push(idea);
      seenTitles.add(idea.title.toLowerCase());
    }
  });
  
  return ideas;
}

// Главная функция
async function main() {
  let projectId = process.argv[2];
  let hypothesisId = process.argv[3] || null;
  
  console.log('🚀 Добавление идей контента из файлов');
  console.log('='.repeat(80));
    console.log('TRYGO-Backend URL (для авторизации):', TRYGO_BACKEND_GRAPHQL_URL);
    console.log('Backend URL (для createCustomContentIdea):', BACKEND_GRAPHQL_URL);
  
  try {
    // Авторизация
    const token = await login();
    
    // Если projectId не указан, выбираем проект автоматически
    if (!projectId) {
      const { project, hypotheses } = await selectProject(token);
      projectId = project.id;
      
      // Если есть гипотезы и hypothesisId не указан, можно использовать первую
      // Но оставляем null, чтобы идеи были привязаны к проекту, а не к конкретной гипотезе
      if (hypotheses.length > 0 && !hypothesisId) {
        console.log(`\n💡 Идеи будут добавлены в проект без привязки к конкретной гипотезе.`);
        console.log(`   Если нужно привязать к гипотезе, укажите hypothesisId при запуске.`);
      }
    } else {
      // Проверяем, что проект существует (пропускаем проверку, если проект не найден - возможно он в другой базе)
      try {
        const projects = await getProjects(token);
        const project = projects.find(p => p.id === projectId);
        if (project) {
          console.log(`\n✅ Используется проект: "${project.title}" (ID: ${projectId})`);
        } else {
          console.log(`\n⚠️  Проект с ID ${projectId} не найден в списке проектов, но продолжаем (возможно проект в другой базе)`);
        }
      } catch (error) {
        console.log(`\n⚠️  Не удалось получить список проектов: ${error.message}, но продолжаем`);
      }
      
      if (hypothesisId) {
        try {
          const hypotheses = await getHypotheses(token, projectId);
          const hypothesis = hypotheses.find(h => h.id === hypothesisId);
          if (hypothesis) {
            console.log(`✅ Используется гипотеза: "${hypothesis.title}" (ID: ${hypothesisId})`);
          } else {
            console.log(`⚠️  Гипотеза с ID ${hypothesisId} не найдена, идеи будут добавлены без привязки к гипотезе.`);
            hypothesisId = null;
          }
        } catch (error) {
          console.log(`⚠️  Не удалось получить список гипотез: ${error.message}, продолжаем без проверки`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('Project ID:', projectId);
    if (hypothesisId) {
      console.log('Hypothesis ID:', hypothesisId);
    } else {
      console.log('Hypothesis ID: не указан (идеи будут привязаны только к проекту)');
    }
    
    // Парсинг идей из файлов
    console.log('\n📖 Парсинг идей из файлов...');
    const rawIdeas = parseIdeasFromFiles();
    console.log(`✅ Найдено ${rawIdeas.length} идей`);
    
    // Обработка идей
    const processedIdeas = rawIdeas.map(idea => {
      const category = determineCategory(idea.title, idea.description, idea.feature);
      const contentType = determineContentType(idea.title, idea.description, idea.feature);
      
      return {
        ...idea,
        category,
        contentType,
      };
    });
    
    // Группировка по категориям
    const byCategory = {};
    processedIdeas.forEach(idea => {
      if (!byCategory[idea.category]) {
        byCategory[idea.category] = [];
      }
      byCategory[idea.category].push(idea);
    });
    
    console.log('\n📊 Распределение по категориям:');
    Object.keys(byCategory).forEach(cat => {
      console.log(`   ${cat}: ${byCategory[cat].length} идей`);
    });
    
    // Создание идей в базе
    console.log('\n💾 Создание идей в базе данных...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const idea of processedIdeas) {
      try {
        const created = await createContentIdea(token, projectId, hypothesisId, idea);
        console.log(`✅ Создана: "${idea.title}" (${idea.category}, ${idea.contentType}) [ID: ${created.id}]`);
        successCount++;
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Ошибка: "${idea.title}" - ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 Результаты:');
    console.log(`   ✅ Успешно создано: ${successCount}`);
    console.log(`   ❌ Ошибок: ${errorCount}`);
    console.log(`   📊 Всего обработано: ${processedIdeas.length}`);
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Запуск
main().catch(console.error);

