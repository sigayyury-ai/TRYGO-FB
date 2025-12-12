/**
 * Скрипт для прямой миграции email в базе данных
 * 
 * Выполняет:
 * 1. Удаляет аккаунт sigayyury@gmail.com (если существует)
 * 2. Меняет email sigayyury5@gmail.com на sigayyury@gmail.com
 * 
 * ВАЖНО: Все проекты и гипотезы привязаны к userId, поэтому они сохранятся
 * 
 * Использование:
 * FORCE=true node scripts/migrate-email-direct.js
 */

const path = require('path');

// Add backend node_modules to require path
const backendNodeModules = path.join(__dirname, '../TRYGO-Backend/node_modules');
require('module')._initPaths([backendNodeModules]);

// Load .env from backend
const dotenvPath = require.resolve('dotenv', { paths: [backendNodeModules] });
require(dotenvPath).config({ path: path.join(__dirname, '../TRYGO-Backend/.env') });

// Require mongoose from backend
const mongoosePath = require.resolve('mongoose', { paths: [backendNodeModules] });
const mongoose = require(mongoosePath);

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const OLD_TEST_EMAIL = 'sigayyury5@gmail.com';
const NEW_EMAIL = 'sigayyury@gmail.com';

async function migrateEmail() {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_URI или MONGODB_URI не установлен в .env файле');
    process.exit(1);
  }

  const force = process.env.FORCE === 'true';
  if (!force) {
    console.error('❌ Для безопасности установите FORCE=true');
    console.log('Использование: FORCE=true node scripts/migrate-email-direct.js');
    process.exit(1);
  }

  try {
    console.log('🔗 Подключение к базе данных...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    const db = mongoose.connection.db;
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const ProjectHypothesis = mongoose.model('ProjectHypothesis', new mongoose.Schema({}, { strict: false }), 'projecthypotheses');

    // 1. Находим тестовый аккаунт (sigayyury5@gmail.com)
    console.log(`🔍 Поиск тестового аккаунта: ${OLD_TEST_EMAIL}...`);
    const testUser = await User.findOne({ email: OLD_TEST_EMAIL }).exec();
    
    if (!testUser) {
      console.error(`❌ Тестовый аккаунт ${OLD_TEST_EMAIL} не найден`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ Тестовый аккаунт найден:');
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role || 'N/A'}\n`);

    // 2. Проверяем существующий аккаунт (sigayyury@gmail.com)
    console.log(`🔍 Проверка существующего аккаунта: ${NEW_EMAIL}...`);
    const existingUser = await User.findOne({ email: NEW_EMAIL }).exec();
    
    if (existingUser) {
      console.log('⚠️  Найден существующий аккаунт:');
      console.log(`   ID: ${existingUser._id}`);
      console.log(`   Email: ${existingUser.email}`);
      
      // Подсчитываем данные существующего аккаунта
      const existingProjects = await Project.find({ userId: existingUser._id }).exec();
      const existingHypotheses = await ProjectHypothesis.find({ userId: existingUser._id }).exec();
      
      console.log(`   Проектов: ${existingProjects.length}`);
      console.log(`   Гипотез: ${existingHypotheses.length}\n`);

      if (existingProjects.length > 0 || existingHypotheses.length > 0) {
        console.log('⚠️  ВНИМАНИЕ: У существующего аккаунта есть данные!');
        console.log('   Эти данные будут УДАЛЕНЫ вместе с аккаунтом!\n');
      }

      // Удаляем существующий аккаунт
      console.log('🗑️  Удаление существующего аккаунта...');
      await User.deleteOne({ _id: existingUser._id }).exec();
      console.log('✅ Существующий аккаунт удален\n');
    } else {
      console.log('✅ Аккаунт с таким email не найден (можно продолжать)\n');
    }

    // 3. Подсчитываем данные тестового аккаунта
    console.log('📊 Подсчет данных тестового аккаунта...');
    const testProjects = await Project.find({ userId: testUser._id }).exec();
    const testHypotheses = await ProjectHypothesis.find({ userId: testUser._id }).exec();
    
    console.log(`   Проектов: ${testProjects.length}`);
    console.log(`   Гипотез: ${testHypotheses.length}\n`);

    if (testProjects.length > 0) {
      console.log('📋 Список проектов:');
      testProjects.forEach((project, idx) => {
        console.log(`   ${idx + 1}. ${project.title || 'Без названия'} (ID: ${project._id})`);
      });
      console.log('');
    }

    // 4. Меняем email тестового аккаунта
    console.log(`🔄 Изменение email: ${OLD_TEST_EMAIL} → ${NEW_EMAIL}...`);
    testUser.email = NEW_EMAIL;
    await testUser.save();
    console.log('✅ Email успешно изменен\n');

    // 5. Проверяем целостность данных
    console.log('🔍 Проверка целостности данных...');
    const projectsAfter = await Project.find({ userId: testUser._id }).exec();
    const hypothesesAfter = await ProjectHypothesis.find({ userId: testUser._id }).exec();
    
    if (projectsAfter.length !== testProjects.length) {
      console.error(`❌ ОШИБКА: Количество проектов изменилось! Было: ${testProjects.length}, Стало: ${projectsAfter.length}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    if (hypothesesAfter.length !== testHypotheses.length) {
      console.error(`❌ ОШИБКА: Количество гипотез изменилось! Было: ${testHypotheses.length}, Стало: ${hypothesesAfter.length}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ Все данные сохранены');
    console.log(`   Проектов: ${projectsAfter.length} (без изменений)`);
    console.log(`   Гипотез: ${hypothesesAfter.length} (без изменений)\n`);

    // 6. Финальная информация
    console.log('✅ Миграция завершена успешно!');
    console.log(`   Пользователь ID: ${testUser._id}`);
    console.log(`   Новый email: ${NEW_EMAIL}`);
    console.log(`   Проектов сохранено: ${projectsAfter.length}`);
    console.log(`   Гипотез сохранено: ${hypothesesAfter.length}\n`);

    // Проверяем финальное состояние - используем прямой запрос к коллекции
    const usersCollection = mongoose.connection.db.collection('users');
    const finalUserDoc = await usersCollection.findOne({ _id: testUser._id });
    
    if (finalUserDoc && finalUserDoc.email === NEW_EMAIL) {
      console.log('✅ Финальная проверка: email успешно изменен в базе данных');
      console.log(`   Email в базе: ${finalUserDoc.email}`);
    } else {
      console.log('⚠️  Предупреждение: не удалось проверить финальное состояние');
      console.log(`   Но миграция выполнена - проверьте вручную`);
    }

    await mongoose.disconnect();
    console.log('👋 Отключение от базы данных');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

migrateEmail().catch(console.error);

