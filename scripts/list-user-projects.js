/**
 * Скрипт для получения списка проектов пользователя
 * 
 * Использование:
 * node scripts/list-user-projects.js [email]
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

async function listUserProjects(email) {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_URI или MONGODB_URI не установлен в .env файле');
    console.log('Проверьте переменные окружения:');
    console.log('  - MONGO_URI (для TRYGO-Backend)');
    console.log('  - MONGODB_URI (для backend)');
    process.exit(1);
  }

  try {
    console.log(`🔗 Подключение к базе данных...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    // Ищем пользователя (пробуем разные варианты)
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    let user = await User.findOne({ email }).exec();
    
    // Если не нашли, пробуем найти по части email
    if (!user) {
      user = await User.findOne({ email: { $regex: email.split('@')[0], $options: 'i' } }).exec();
    }
    
    // Если все еще не нашли, выводим всех пользователей
    if (!user) {
      console.log('⚠️ Пользователь не найден. Список всех пользователей в базе:\n');
      const allUsers = await User.find({}).limit(20).exec();
      if (allUsers.length > 0) {
        allUsers.forEach((u, idx) => {
          console.log(`${idx + 1}. Email: ${u.email || 'N/A'}, ID: ${u._id}`);
        });
      } else {
        console.log('В базе нет пользователей');
      }
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('👤 Пользователь:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || 'N/A'}\n`);

    // Ищем проекты пользователя
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const projects = await Project.find({ userId: user._id }).exec();

    console.log(`📋 Найдено проектов: ${projects.length}\n`);

    if (projects.length === 0) {
      console.log('⚠️ У пользователя нет проектов');
    } else {
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        console.log(`${i + 1}. ${project.title || 'Без названия'}`);
        console.log(`   Project ID: ${project._id}`);
        console.log(`   Created: ${project.createdAt || 'N/A'}`);
        console.log(`   Status: ${project.generationStatus || 'N/A'}`);
        
        // Ищем гипотезы для этого проекта
        let hypotheses = [];
        try {
          // Пробуем разные названия коллекций
          const HypothesisModel = mongoose.models.ProjectHypothesis || 
            mongoose.model('ProjectHypothesis', new mongoose.Schema({}, { strict: false }), 'projecthypotheses');
          hypotheses = await HypothesisModel.find({ projectId: project._id }).exec();
        } catch (err) {
          // Если не получилось, пробуем другую коллекцию
          try {
            const HypothesisModel2 = mongoose.model('Hypothesis', new mongoose.Schema({}, { strict: false }), 'hypotheses');
            hypotheses = await HypothesisModel2.find({ projectId: project._id }).exec();
          } catch (err2) {
            // Игнорируем ошибку
          }
        }
        
        if (hypotheses.length > 0) {
          console.log(`   Гипотезы (${hypotheses.length}):`);
          hypotheses.forEach((hyp, idx) => {
            console.log(`      ${idx + 1}. ${hyp.title || 'Без названия'} (ID: ${hyp._id})`);
          });
        } else {
          console.log(`   Гипотезы: нет`);
        }
        console.log('');
      }
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

const email = process.argv[2] || 'sigayyury5@gmail.com';

listUserProjects(email).catch(console.error);

