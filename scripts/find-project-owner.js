/**
 * Скрипт для поиска владельца проекта
 * 
 * Использование:
 * node scripts/find-project-owner.js <projectId>
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

const MONGODB_URI = process.env.MONGODB_URI;

async function findProjectOwner(projectId) {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI не установлен в .env файле');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    // Ищем проект
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const project = await Project.findById(projectId).exec();

    if (!project) {
      console.error(`❌ Проект с ID ${projectId} не найден`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📋 Информация о проекте:');
    console.log(`   ID: ${project._id}`);
    console.log(`   Title: ${project.title || 'N/A'}`);
    console.log(`   User ID: ${project.userId}`);

    // Ищем пользователя
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const user = await User.findById(project.userId).exec();

    if (user) {
      console.log('\n👤 Владелец проекта:');
      console.log(`   User ID: ${user._id}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
    } else {
      console.log('\n⚠️ Пользователь не найден');
      console.log(`   User ID: ${project.userId}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

const projectId = process.argv[2];

if (!projectId) {
  console.error('❌ Ошибка: необходимо указать projectId');
  console.log('Использование: node scripts/find-project-owner.js <projectId>');
  process.exit(1);
}

findProjectOwner(projectId).catch(console.error);

