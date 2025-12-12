/**
 * Скрипт для проверки миграции email
 */

const path = require('path');
const backendNodeModules = path.join(__dirname, '../TRYGO-Backend/node_modules');
require('module')._initPaths([backendNodeModules]);
const dotenvPath = require.resolve('dotenv', { paths: [backendNodeModules] });
require(dotenvPath).config({ path: path.join(__dirname, '../TRYGO-Backend/.env') });
const mongoosePath = require.resolve('mongoose', { paths: [backendNodeModules] });
const mongoose = require(mongoosePath);

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function verifyMigration() {
  try {
    console.log('🔗 Подключение к базе данных...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено\n');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');

    // Проверяем старый email
    console.log('🔍 Проверка старого email (sigayyury5@gmail.com)...');
    const oldUser = await User.findOne({ email: 'sigayyury5@gmail.com' }).exec();
    if (oldUser) {
      console.log('❌ СТАРЫЙ EMAIL ВСЕ ЕЩЕ СУЩЕСТВУЕТ!');
      console.log(`   ID: ${oldUser._id}`);
      console.log(`   Email: ${oldUser.email}`);
    } else {
      console.log('✅ Старый email не найден (хорошо)\n');
    }

    // Проверяем новый email
    console.log('🔍 Проверка нового email (sigayyury@gmail.com)...');
    const newUser = await User.findOne({ email: 'sigayyury@gmail.com' }).exec();
    if (newUser) {
      console.log('✅ Пользователь найден с новым email:');
      console.log(`   ID: ${newUser._id}`);
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Role: ${newUser.role || 'N/A'}`);
      console.log(`   PasswordHash: ${newUser.passwordHash ? 'Есть' : 'ОТСУТСТВУЕТ!'}`);
      console.log(`   Created: ${newUser.createdAt || 'N/A'}\n`);

      // Проверяем проекты
      const projects = await Project.find({ userId: newUser._id }).exec();
      console.log(`📊 Проектов у пользователя: ${projects.length}`);
      if (projects.length > 0) {
        projects.forEach((p, idx) => {
          console.log(`   ${idx + 1}. ${p.title || 'Без названия'} (ID: ${p._id})`);
        });
      }
    } else {
      console.log('❌ Пользователь с новым email НЕ НАЙДЕН!\n');
      
      // Ищем по ID
      console.log('🔍 Поиск по ID 686773b5773b5947fed60a68...');
      const userById = await User.findById('686773b5773b5947fed60a68').exec();
      if (userById) {
        console.log('✅ Пользователь найден по ID:');
        console.log(`   ID: ${userById._id}`);
        console.log(`   Email: ${userById.email}`);
        console.log(`   PasswordHash: ${userById.passwordHash ? 'Есть' : 'ОТСУТСТВУЕТ!'}`);
      } else {
        console.log('❌ Пользователь не найден даже по ID');
      }
    }

    // Показываем всех пользователей с похожими email
    console.log('\n🔍 Все пользователи с email содержащим "sigayyury"...');
    const allUsers = await User.find({ 
      email: { $regex: 'sigayyury', $options: 'i' } 
    }).exec();
    
    if (allUsers.length > 0) {
      allUsers.forEach((u, idx) => {
        console.log(`   ${idx + 1}. Email: ${u.email}, ID: ${u._id}, PasswordHash: ${u.passwordHash ? 'Есть' : 'НЕТ'}`);
      });
    } else {
      console.log('   Не найдено');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

verifyMigration().catch(console.error);

