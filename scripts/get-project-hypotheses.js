/**
 * Скрипт для получения списка гипотез проекта
 * 
 * Использование:
 * node scripts/get-project-hypotheses.js <projectId>
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

async function getProjectHypotheses(projectId) {
  if (!MONGODB_URI) {
    console.error('❌ MONGO_URI не установлен');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключение к MongoDB установлено\n');

    // Проверяем проект
    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }), 'projects');
    const project = await Project.findById(projectId).exec();

    if (!project) {
      console.error(`❌ Проект с ID ${projectId} не найден`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📋 Проект:');
    console.log(`   Название: ${project.title || 'N/A'}`);
    console.log(`   ID: ${project._id}`);
    console.log(`   User ID: ${project.userId}\n`);

    // Ищем гипотезы - пробуем разные коллекции
    let hypotheses = [];
    
    // Пробуем разные варианты коллекций
    const collectionsToTry = ['projectHypotheses', 'projecthypotheses', 'hypotheses'];
    
    for (const collectionName of collectionsToTry) {
      try {
        const HypothesisModel = mongoose.models[`ProjectHypothesis_${collectionName}`] || 
          mongoose.model(`ProjectHypothesis_${collectionName}`, new mongoose.Schema({}, { strict: false }), collectionName);
        const found = await HypothesisModel.find({ projectId: project._id }).exec();
        if (found.length > 0) {
          hypotheses = found;
          console.log(`✅ Найдено гипотез в коллекции '${collectionName}': ${hypotheses.length}\n`);
          break;
        }
      } catch (err) {
        // Пробуем следующую коллекцию
      }
    }
    
    // Если не нашли, пробуем через ObjectId
    if (hypotheses.length === 0) {
      for (const collectionName of collectionsToTry) {
        try {
          const HypothesisModel = mongoose.model(`ProjectHypothesis_${collectionName}_2`, new mongoose.Schema({}, { strict: false }), collectionName);
          const found = await HypothesisModel.find({ 
            projectId: new mongoose.Types.ObjectId(projectId) 
          }).exec();
          if (found.length > 0) {
            hypotheses = found;
            console.log(`✅ Найдено гипотез в коллекции '${collectionName}' (через ObjectId): ${hypotheses.length}\n`);
            break;
          }
        } catch (err) {
          // Пробуем следующую коллекцию
        }
      }
    }

    // Если не нашли, пробуем другие коллекции
    if (hypotheses.length === 0) {
      try {
        const HypothesisModel2 = mongoose.model('Hypothesis', new mongoose.Schema({}, { strict: false }), 'hypotheses');
        hypotheses = await HypothesisModel2.find({ projectId: project._id }).exec();
        if (hypotheses.length > 0) {
          console.log(`✅ Найдено гипотез в коллекции 'hypotheses': ${hypotheses.length}\n`);
        }
      } catch (err2) {
        // Игнорируем
      }
    }

    // Пробуем найти через ObjectId строку
    if (hypotheses.length === 0) {
      try {
        const HypothesisModel3 = mongoose.models.ProjectHypothesis || 
          mongoose.model('ProjectHypothesis', new mongoose.Schema({}, { strict: false }), 'projecthypotheses');
        hypotheses = await HypothesisModel3.find({ 
          projectId: new mongoose.Types.ObjectId(projectId) 
        }).exec();
        if (hypotheses.length > 0) {
          console.log(`✅ Найдено гипотез (через ObjectId): ${hypotheses.length}\n`);
        }
      } catch (err3) {
        // Игнорируем
      }
    }

    // Показываем все коллекции для отладки
    if (hypotheses.length === 0) {
      console.log('🔍 Проверяем доступные коллекции...\n');
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const relevantCollections = collections.filter(c => 
        c.name.toLowerCase().includes('hypothesis') || 
        c.name.toLowerCase().includes('project')
      );
      if (relevantCollections.length > 0) {
        console.log('Найдены релевантные коллекции:');
        relevantCollections.forEach(c => console.log(`   - ${c.name}`));
        console.log('');
      }
    }

    if (hypotheses.length === 0) {
      console.log('⚠️ Гипотезы не найдены для этого проекта');
    } else {
      console.log('📝 Список гипотез:\n');
      hypotheses.forEach((hyp, idx) => {
        console.log(`${idx + 1}. ${hyp.title || 'Без названия'}`);
        console.log(`   Hypothesis ID: ${hyp._id}`);
        console.log(`   Project ID: ${hyp.projectId || 'N/A'}`);
        if (hyp.description) {
          const desc = hyp.description.length > 100 
            ? hyp.description.substring(0, 100) + '...' 
            : hyp.description;
          console.log(`   Описание: ${desc}`);
        }
        console.log('');
      });
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

const projectId = process.argv[2];

if (!projectId) {
  console.error('❌ Ошибка: необходимо указать projectId');
  console.log('Использование: node scripts/get-project-hypotheses.js <projectId>');
  process.exit(1);
}

getProjectHypotheses(projectId).catch(console.error);

