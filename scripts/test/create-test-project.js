/**
 * Скрипт для создания нового тестового проекта через Socket.IO
 * 
 * Запуск: node create-test-project.js
 * Требуется: Node.js 18+, Socket.IO клиент, запущенный бэкенд
 */

const TEST_EMAIL = 'sigayyury5@gmail.com';
const TEST_PASSWORD = '1237895aA';
const GRAPHQL_URL = 'http://localhost:5001/graphql';

let authToken = null;

// Утилита для GraphQL запросов
async function graphqlRequest(query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });
  
  return await response.json();
}

// Логин для получения токена
async function login() {
  console.log('🔐 Логин для получения токена...');
  
  const mutation = `
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        user {
          id
          email
        }
        token
      }
    }
  `;
  
  const result = await graphqlRequest(mutation, {
    input: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });
  
  if (result.errors) {
    throw new Error(`Ошибка логина: ${result.errors[0]?.message}`);
  }
  
  authToken = result.data.login.token;
  console.log('✅ Логин успешен\n');
  return authToken;
}

// Создание проекта через Socket.IO
async function createProjectViaSocket() {
  console.log('📡 Создание проекта через Socket.IO...');
  
  try {
    // Пробуем импортировать socket.io-client
    let io;
    try {
      // Пробуем найти socket.io-client в node_modules
      const path = require('path');
      const fs = require('fs');
      const frontendPath = path.join(__dirname, 'TRYGO-Front');
      
      if (fs.existsSync(path.join(frontendPath, 'node_modules', 'socket.io-client'))) {
        io = require(path.join(frontendPath, 'node_modules', 'socket.io-client')).io;
      } else {
        // Пробуем глобально
        io = require('socket.io-client').io;
      }
    } catch (e) {
      console.error('❌ Socket.IO клиент не найден');
      console.error('   Установите: cd TRYGO-Front && npm install socket.io-client');
      throw e;
    }
    
    const WS_URL = process.env.VITE_WS_SERVER_URL || 'ws://localhost:5001';
    
    console.log(`   Подключение к ${WS_URL}...`);
    
    const socket = io(WS_URL, {
      transports: ['websocket'],
      query: { token: authToken },
      reconnection: false,
      timeout: 5000
    });
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Таймаут ожидания ответа (30 секунд)'));
      }, 30000);
      
      socket.on('connect', () => {
        console.log('✅ Подключено к Socket.IO');
        console.log('   Отправка запроса на создание проекта...');
        
        const projectData = {
          startType: 'START_FROM_SCRATCH',
          info: 'Test project created via automation script for stabilization testing'
        };
        
        socket.emit('generateProject', projectData);
      });
      
      socket.on('projectGenerated', (data) => {
        clearTimeout(timeout);
        socket.disconnect();
        
        if (data.projectId) {
          console.log(`✅ Проект создан! ID: ${data.projectId}`);
          resolve(data.projectId);
        } else {
          reject(new Error('Проект создан, но ID не получен'));
        }
      });
      
      socket.on('error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        reject(new Error(`Socket.IO ошибка: ${error.message || error}`));
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Ошибка подключения: ${error.message}`));
      });
    });
  } catch (error) {
    throw error;
  }
}

// Проверка созданного проекта
async function verifyProject(projectId) {
  console.log('\n🔍 Проверка созданного проекта...');
  
  const query = `
    query GetProjects {
      getProjects {
        id
        title
        generationStatus
      }
    }
  `;
  
  const result = await graphqlRequest(query, {}, authToken);
  
  if (result.errors) {
    console.log('⚠️  Ошибка при получении проектов:', result.errors[0]?.message);
    return;
  }
  
  const projects = result.data?.getProjects || [];
  const createdProject = projects.find(p => p.id === projectId);
  
  if (createdProject) {
    console.log('✅ Проект найден в списке:');
    console.log(`   ID: ${createdProject.id}`);
    console.log(`   Title: ${createdProject.title}`);
    console.log(`   Status: ${createdProject.generationStatus}`);
  } else {
    console.log('⚠️  Проект не найден в списке (может быть еще генерируется)');
    console.log(`   Всего проектов: ${projects.length}`);
  }
}

// Главная функция
async function main() {
  try {
    console.log('🧪 СОЗДАНИЕ НОВОГО ТЕСТОВОГО ПРОЕКТА\n');
    console.log('='.repeat(60));
    
    // 1. Логин
    await login();
    
    // 2. Создание проекта
    const projectId = await createProjectViaSocket();
    
    // 3. Проверка
    await verifyProject(projectId);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ГОТОВО! Проект создан успешно');
    console.log(`   Project ID: ${projectId}`);
    console.log('\n💡 Теперь проверьте логи бэкенда для анализа процесса создания');
    
  } catch (error) {
    console.error('\n❌ ОШИБКА:', error.message);
    console.error('\n💡 Убедитесь что:');
    console.error('   1. Бэкенд запущен на http://localhost:5001');
    console.error('   2. Socket.IO доступен на ws://localhost:5001');
    console.error('   3. Тестовый пользователь существует');
    console.error('   4. Socket.IO клиент установлен: cd TRYGO-Front && npm install socket.io-client');
    process.exit(1);
  }
}

main();

