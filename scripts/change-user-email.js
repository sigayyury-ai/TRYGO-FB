/**
 * Скрипт для безопасной смены email пользователя
 * 
 * ВАЖНО: Все проекты и гипотезы привязаны к userId (ObjectId), а не к email,
 * поэтому смена email не приведет к потере данных.
 * 
 * Использование:
 * node scripts/change-user-email.js [oldEmail] [newEmail]
 * 
 * Пример:
 * node scripts/change-user-email.js sigayyury5@gmail.com sigayyury@gmail.com
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

// Пробуем разные варианты переменных окружения
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function changeUserEmail(oldEmail, newEmail) {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_URI или MONGODB_URI не установлен в .env файле');
    process.exit(1);
  }

  if (!oldEmail || !newEmail) {
    console.error('❌ Необходимо указать оба email: старый и новый');
    console.log('Использование: node scripts/change-user-email.js [oldEmail] [newEmail]');
    process.exit(1);
  }

  if (oldEmail === newEmail) {
    console.error('❌ Старый и новый email не могут быть одинаковыми');
    process.exit(1);
  }

  // Простая валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(oldEmail) || !emailRegex.test(newEmail)) {
    console.error('❌ Один или оба email имеют неверный формат');
    process.exit(1);
  }

  try {
    console.log('🔗 Подключение к базе данных...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const ProjectHypothesis = mongoose.model('ProjectHypothesis', new mongoose.Schema({}, { strict: false }), 'projecthypotheses');

    // 1. Находим пользователя по старому email
    console.log(`🔍 Поиск пользователя с email: ${oldEmail}...`);
    const user = await User.findOne({ email: oldEmail }).exec();
    
    if (!user) {
      console.error(`❌ Пользователь с email ${oldEmail} не найден`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ Пользователь найден:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || 'N/A'}`);
    console.log(`   Created: ${user.createdAt || 'N/A'}\n`);

    // 2. Проверяем, что новый email не занят
    console.log(`🔍 Проверка доступности нового email: ${newEmail}...`);
    const existingUser = await User.findOne({ email: newEmail }).exec();
    
    if (existingUser) {
      if (existingUser._id.toString() === user._id.toString()) {
        console.log('⚠️ Пользователь уже использует этот email');
        await mongoose.disconnect();
        process.exit(0);
      } else {
        console.error(`❌ Email ${newEmail} уже занят другим пользователем (ID: ${existingUser._id})`);
        await mongoose.disconnect();
        process.exit(1);
      }
    }

    console.log('✅ Новый email доступен\n');

    // 3. Подсчитываем проекты и гипотезы перед миграцией
    console.log('📊 Подсчет данных пользователя...');
    const projects = await Project.find({ userId: user._id }).exec();
    const hypotheses = await ProjectHypothesis.find({ userId: user._id }).exec();
    
    console.log(`   Проектов: ${projects.length}`);
    console.log(`   Гипотез: ${hypotheses.length}\n`);

    if (projects.length > 0) {
      console.log('📋 Список проектов:');
      projects.forEach((project, idx) => {
        console.log(`   ${idx + 1}. ${project.title || 'Без названия'} (ID: ${project._id})`);
      });
      console.log('');
    }

    // 4. Запрашиваем подтверждение
    console.log('⚠️  ВНИМАНИЕ: Вы собираетесь изменить email пользователя');
    console.log(`   Старый email: ${oldEmail}`);
    console.log(`   Новый email: ${newEmail}`);
    console.log(`   Все проекты (${projects.length}) и гипотезы (${hypotheses.length}) останутся привязанными к этому пользователю\n`);
    
    // В production можно добавить readline для интерактивного подтверждения
    // Для автоматизации используем переменную окружения FORCE=true
    const force = process.env.FORCE === 'true';
    
    if (!force) {
      console.log('💡 Для автоматического подтверждения установите переменную окружения FORCE=true');
      console.log('   Пример: FORCE=true node scripts/change-user-email.js [oldEmail] [newEmail]\n');
      console.log('⏸️  Для продолжения установите FORCE=true или измените скрипт для интерактивного подтверждения');
      await mongoose.disconnect();
      process.exit(0);
    }

    // 5. Выполняем миграцию
    console.log('🔄 Выполнение миграции email...');
    user.email = newEmail;
    await user.save();
    console.log('✅ Email успешно изменен\n');

    // 6. Проверяем, что данные остались привязанными
    console.log('🔍 Проверка целостности данных...');
    const projectsAfter = await Project.find({ userId: user._id }).exec();
    const hypothesesAfter = await ProjectHypothesis.find({ userId: user._id }).exec();
    
    if (projectsAfter.length !== projects.length) {
      console.error(`❌ КРИТИЧЕСКАЯ ОШИБКА: Количество проектов изменилось! Было: ${projects.length}, Стало: ${projectsAfter.length}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    if (hypothesesAfter.length !== hypotheses.length) {
      console.error(`❌ КРИТИЧЕСКАЯ ОШИБКА: Количество гипотез изменилось! Было: ${hypotheses.length}, Стало: ${hypothesesAfter.length}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('✅ Все данные остались привязанными к пользователю');
    console.log(`   Проектов: ${projectsAfter.length} (без изменений)`);
    console.log(`   Гипотез: ${hypothesesAfter.length} (без изменений)\n`);

    // 7. Финальная информация
    console.log('✅ Миграция завершена успешно!');
    console.log(`   Пользователь ID: ${user._id}`);
    console.log(`   Новый email: ${newEmail}`);
    console.log(`   Проектов сохранено: ${projectsAfter.length}`);
    console.log(`   Гипотез сохранено: ${hypothesesAfter.length}\n`);

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

const oldEmail = process.argv[2];
const newEmail = process.argv[3];

changeUserEmail(oldEmail, newEmail).catch(console.error);

