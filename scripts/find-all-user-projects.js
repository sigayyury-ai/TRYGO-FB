/**
 * Скрипт для поиска всех проектов пользователя
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

async function findAllUserProjects(email) {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_URI не установлен');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    // Ищем пользователя
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const user = await User.findOne({ email }).exec();

    if (!user) {
      console.error(`❌ Пользователь не найден`);
      process.exit(1);
    }

    console.log('👤 Пользователь:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}\n`);

    // Ищем все проекты пользователя
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const projects = await Project.find({ userId: user._id }).sort({ createdAt: -1 }).exec();

    console.log(`📋 Всего проектов: ${projects.length}\n`);

    // Ищем проекты с нужными названиями
    const aiMarketingProjects = projects.filter(p => 
      p.title && p.title.toLowerCase().includes('ai marketing copilot')
    );
    const comoonProjects = projects.filter(p => 
      p.title && p.title.toLowerCase().includes('comoon')
    );

    console.log('🔍 Проекты "AI marketing copilot":');
    if (aiMarketingProjects.length === 0) {
      console.log('   Не найдено');
    } else {
      aiMarketingProjects.forEach((p, idx) => {
        console.log(`\n   ${idx + 1}. ${p.title}`);
        console.log(`      Project ID: ${p._id}`);
        console.log(`      Created: ${p.createdAt}`);
        console.log(`      Status: ${p.generationStatus || 'N/A'}`);
      });
    }

    console.log('\n🔍 Проекты "COMOON" / "Comoon":');
    if (comoonProjects.length === 0) {
      console.log('   Не найдено');
    } else {
      comoonProjects.forEach((p, idx) => {
        console.log(`\n   ${idx + 1}. ${p.title}`);
        console.log(`      Project ID: ${p._id}`);
        console.log(`      Created: ${p.createdAt}`);
        console.log(`      Status: ${p.generationStatus || 'N/A'}`);
      });
    }

    // Проверяем также проект с ID, который указал пользователь
    console.log('\n🔍 Проверка проекта 69387a92ef08390214f02418:');
    const specificProject = await Project.findById('69387a92ef08390214f02418').exec();
    if (specificProject) {
      console.log(`   Найден: ${specificProject.title}`);
      console.log(`   User ID: ${specificProject.userId}`);
      console.log(`   Принадлежит пользователю: ${specificProject.userId.toString() === user._id.toString() ? '✅ ДА' : '❌ НЕТ'}`);
      
      if (specificProject.userId.toString() === user._id.toString()) {
        console.log(`   ✅ Это ваш проект!`);
      } else {
        // Проверяем, может это тот же пользователь под другим ID
        const owner = await User.findById(specificProject.userId).exec();
        if (owner) {
          console.log(`   Владелец: ${owner.email || 'N/A'} (ID: ${owner._id})`);
        }
      }
    } else {
      console.log('   Не найден');
    }

    // Выводим все проекты для справки
    console.log('\n📋 Все проекты пользователя:');
    projects.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.title || 'Без названия'} (ID: ${p._id})`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

const email = process.argv[2] || 'sigayyury5@gmail.com';
findAllUserProjects(email).catch(console.error);





