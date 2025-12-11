/**
 * Скрипт для удаления тестового пользователя из MongoDB
 * 
 * Запуск: node delete-test-user.js
 * Требуется: Node.js 18+, MongoDB подключение, mongoose из TRYGO-Backend
 */

const TEST_EMAIL = 'sigayyury5@gmail.com';

async function deleteTestUser() {
  try {
    const path = require('path');
    const fs = require('fs');
    
    // Определяем путь к бэкенду
    const backendPath = path.join(__dirname, 'TRYGO-Backend');
    
    if (!fs.existsSync(backendPath)) {
      throw new Error('TRYGO-Backend директория не найдена');
    }
    
    // Загружаем переменные окружения из .env бэкенда
    require('dotenv').config({ path: path.join(backendPath, '.env') });
    
    // Получаем MongoDB URI
    const MONGODB_URI = process.env.MONGO_URL || 
                       process.env.MONGODB_URI || 
                       process.env.DATABASE_URL || 
                       'mongodb://localhost:27017/trygo';
    
    console.log('🔌 Подключение к MongoDB через mongoose...');
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`); // Скрываем пароль в логах
    
    // Используем mongoose из бэкенда
    const mongoose = require(path.join(backendPath, 'node_modules', 'mongoose'));
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Подключено к MongoDB\n');
    
    // Используем UserModel из бэкенда
    const UserModelPath = path.join(backendPath, 'dist', 'models', 'UserModel.js');
    let UserModel;
    
    if (fs.existsSync(UserModelPath)) {
      // Используем скомпилированную версию
      UserModel = require(UserModelPath).default;
    } else {
      // Или используем TypeScript версию (если есть ts-node)
      const UserModelTs = path.join(backendPath, 'src', 'models', 'UserModel.ts');
      if (fs.existsSync(UserModelTs)) {
        // Простое удаление через mongoose напрямую
        const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
        UserModel = mongoose.model('User', userSchema);
      } else {
        throw new Error('UserModel не найден');
      }
    }
    
    // Ищем пользователя по email
    console.log(`🔍 Поиск пользователя: ${TEST_EMAIL}...`);
    const user = await UserModel.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log('   ⚠️  Пользователь не найден в БД');
      await mongoose.disconnect();
      return;
    }
    
    console.log(`   ✅ Найден пользователь: ${user.email}`);
    console.log(`   🆔 ID: ${user._id}`);
    console.log(`   📅 Создан: ${user.createdAt || 'неизвестно'}\n`);
    
    // Удаляем пользователя
    console.log('🗑️  Удаление пользователя...');
    await UserModel.deleteOne({ email: TEST_EMAIL });
    console.log('   ✅ Пользователь успешно удален из БД\n');
    
    // Также удаляем связанные данные
    console.log('🧹 Очистка связанных данных...');
    const db = mongoose.connection.db;
    
    // Удаляем проекты пользователя
    const projectsCollection = db.collection('projects');
    const projectsResult = await projectsCollection.deleteMany({ userId: user._id.toString() });
    console.log(`   ✅ Удалено проектов: ${projectsResult.deletedCount}`);
    
    await mongoose.disconnect();
    console.log('🔌 Соединение с MongoDB закрыто');
    console.log('\n🎉 Готово!');
    
  } catch (error) {
    console.error('\n💥 ОШИБКА:', error.message);
    console.error('\n💡 Убедитесь что:');
    console.error('   1. MongoDB запущен');
    console.error('   2. Переменная окружения MONGO_URL установлена в TRYGO-Backend/.env');
    console.error('   3. Установлены зависимости бэкенда: cd TRYGO-Backend && npm install');
    console.error('   4. У вас есть права на удаление из коллекции users');
    process.exit(1);
  }
}

// Запуск
deleteTestUser();

