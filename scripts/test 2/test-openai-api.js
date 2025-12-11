/**
 * Тест OpenAI API подключения
 * 
 * Запуск: node test-openai-api.js
 */

async function testOpenAI() {
  try {
    const path = require('path');
    const fs = require('fs');
    
    // Читаем .env вручную
    const envPath = path.join(__dirname, 'TRYGO-Backend', '.env');
    let OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY && fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/OPENAI_API_KEY=(.+)/);
      if (match) {
        OPENAI_API_KEY = match[1].trim();
      }
    }
    
    console.log('🧪 ТЕСТ OPENAI API\n');
    console.log('='.repeat(60));
    
    if (!OPENAI_API_KEY) {
      console.log('❌ OPENAI_API_KEY не найден в .env файле');
      console.log('\n💡 Добавьте в TRYGO-Backend/.env:');
      console.log('   OPENAI_API_KEY=sk-...');
      return;
    }
    
    console.log('✅ OPENAI_API_KEY найден');
    console.log(`   Ключ: ${OPENAI_API_KEY.substring(0, 7)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}\n`);
    
    // Пробуем импортировать OpenAI
    let OpenAI;
    try {
      const backendPath = path.join(__dirname, 'TRYGO-Backend');
      if (fs.existsSync(path.join(backendPath, 'node_modules', 'openai'))) {
        OpenAI = require(path.join(backendPath, 'node_modules', 'openai')).default;
      } else {
        OpenAI = require('openai').default;
      }
    } catch (e) {
      console.log('❌ OpenAI библиотека не найдена');
      console.log('   Установите: cd TRYGO-Backend && npm install');
      return;
    }
    
    console.log('✅ OpenAI библиотека найдена\n');
    console.log('🔌 Тестирование подключения к OpenAI API...');
    
    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY
    });
    
    // Простой тест - проверка модели
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Say "OK" if you can hear me' }
        ],
        max_tokens: 10
      });
      
      const message = response.choices[0]?.message?.content || '';
      console.log('✅ OpenAI API работает!');
      console.log(`   Ответ: ${message}\n`);
      
    } catch (error) {
      console.log('❌ Ошибка при запросе к OpenAI API:');
      console.log(`   ${error.message}\n`);
      
      if (error.status === 401) {
        console.log('💡 Проблема: Неверный API ключ');
      } else if (error.status === 429) {
        console.log('💡 Проблема: Превышен лимит запросов');
      } else if (error.status === 500) {
        console.log('💡 Проблема: Ошибка на стороне OpenAI');
      }
    }
    
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:', error.message);
  }
}

testOpenAI();

