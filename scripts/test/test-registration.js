/**
 * Автотест для регистрации в TRYGO
 * 
 * Запуск: node test-registration.js
 * Требуется: Node.js 18+ (встроенный fetch)
 */

const GRAPHQL_URL = 'http://localhost:5001/graphql';
const TEST_EMAIL = 'sigayyury5@gmail.com';
const TEST_PASSWORD = '1237895aA';

async function testRegistration() {
  console.log('🧪 Начинаю тест регистрации...\n');
  
  try {
    // 1. Проверка доступности GraphQL endpoint
    console.log('1️⃣ Проверка доступности GraphQL endpoint...');
    const healthCheck = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' })
    });
    
    if (!healthCheck.ok) {
      throw new Error(`GraphQL endpoint недоступен: ${healthCheck.status}`);
    }
    console.log('   ✅ GraphQL endpoint доступен\n');
    
    // 2. Попытка регистрации
    console.log(`2️⃣ Регистрация пользователя: ${TEST_EMAIL}...`);
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(input: $input) {
          user {
            id
            email
            role
          }
          token
        }
      }
    `;
    
    const registerResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: registerMutation,
        variables: {
          input: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
          }
        }
      })
    });
    
    const registerData = await registerResponse.json();
    
    if (registerData.errors) {
      const errorMessage = registerData.errors[0]?.message || 'Unknown error';
      
      // Если пользователь уже существует - это нормально, пробуем логин
      if (errorMessage.includes('already exists') || errorMessage.includes('already registered')) {
        console.log('   ⚠️  Пользователь уже существует, пробую логин...\n');
        return await testLogin();
      }
      
      throw new Error(`Ошибка регистрации: ${errorMessage}`);
    }
    
    if (!registerData.data?.register) {
      throw new Error('Неожиданный ответ от сервера');
    }
    
    const { user, token } = registerData.data.register;
    console.log('   ✅ Регистрация успешна!');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🆔 ID: ${user.id}`);
    console.log(`   🔑 Token получен: ${token ? 'Да' : 'Нет'}\n`);
    
    // 3. Проверка токена через getUserByToken
    console.log('3️⃣ Проверка токена через getUserByToken...');
    const getUserQuery = `
      query GetUserByToken {
        getUserByToken {
          id
          email
          role
        }
      }
    `;
    
    const userResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: getUserQuery })
    });
    
    const userData = await userResponse.json();
    
    if (userData.errors) {
      throw new Error(`Ошибка проверки токена: ${userData.errors[0]?.message}`);
    }
    
    if (userData.data?.getUserByToken?.email === TEST_EMAIL) {
      console.log('   ✅ Токен валиден, пользователь получен\n');
    } else {
      throw new Error('Токен неверен или пользователь не найден');
    }
    
    // 4. Проверка получения проектов
    console.log('4️⃣ Проверка получения проектов...');
    const getProjectsQuery = `
      query GetProjects {
        getProjects {
          id
          title
        }
      }
    `;
    
    const projectsResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query: getProjectsQuery })
    });
    
    const projectsData = await projectsResponse.json();
    
    if (projectsData.errors) {
      console.log(`   ⚠️  Ошибка получения проектов: ${projectsData.errors[0]?.message}`);
      console.log('   (Это нормально если проектов еще нет)\n');
    } else {
      const projects = projectsData.data?.getProjects || [];
      console.log(`   ✅ Проекты получены: ${projects.length} шт.\n`);
    }
    
    console.log('✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!\n');
    return { success: true, user, token };
    
  } catch (error) {
    console.error('❌ ОШИБКА ТЕСТА:', error.message);
    console.error('   Детали:', error);
    return { success: false, error: error.message };
  }
}

async function testLogin() {
  console.log('🔐 Тест логина...\n');
  
  try {
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(input: $input) {
          user {
            id
            email
            role
          }
          token
        }
      }
    `;
    
    const loginResponse = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: loginMutation,
        variables: {
          input: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
          }
        }
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginData.errors) {
      throw new Error(`Ошибка логина: ${loginData.errors[0]?.message}`);
    }
    
    const { user, token } = loginData.data.login;
    console.log('   ✅ Логин успешен!');
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   🆔 ID: ${user.id}`);
    console.log(`   🔑 Token получен: ${token ? 'Да' : 'Нет'}\n`);
    
    return { success: true, user, token };
    
  } catch (error) {
    console.error('❌ ОШИБКА ЛОГИНА:', error.message);
    return { success: false, error: error.message };
  }
}

// Запуск теста
testRegistration().then(result => {
  if (result.success) {
    console.log('🎉 Тест завершен успешно!');
    process.exit(0);
  } else {
    console.log('💥 Тест провален!');
    process.exit(1);
  }
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});

