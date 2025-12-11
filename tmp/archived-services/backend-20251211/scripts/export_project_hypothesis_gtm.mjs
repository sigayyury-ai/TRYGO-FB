#!/usr/bin/env node

/**
 * Скрипт для экспорта связки проект/гипотезы/GTM из базы данных
 * 
 * Использование:
 *   node scripts/export_project_hypothesis_gtm.mjs
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Получаем MONGODB_URI и заменяем имя базы данных на 'test'
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Ошибка: MONGODB_URI не установлена в переменных окружения');
  process.exit(1);
}

MONGODB_URI = MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/test$1');

// Фильтруем тестовых пользователей
const testPatterns = [
  /sigayyury\d+@gmail\.com/i,
  /sigayyury3@gmail\.com/i,
  /avelmolodecfda\+\d+@gmail\.com/i,
  /.*test.*/i
];

function isTestUser(email) {
  if (!email) return true;
  return testPatterns.some(pattern => pattern.test(email));
}

async function exportData() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    console.log(`✅ Подключено к базе данных: ${db.databaseName}\n`);

    // Загружаем пользователей
    const usersCollection = db.collection('users');
    const allUsers = await usersCollection.find({}).toArray();
    
    // Фильтруем валидных пользователей
    const validUsers = new Map();
    allUsers.forEach(user => {
      const email = user.email || '';
      if (!isTestUser(email)) {
        validUsers.set(user._id.toString(), {
          id: user._id.toString(),
          email: email,
          createdAt: user.createdAt
        });
      }
    });

    console.log(`📊 Валидных пользователей: ${validUsers.size}`);

    // Загружаем проекты
    const projectsCollection = db.collection('projects');
    const validUserIds = Array.from(validUsers.keys()).map(id => new mongoose.Types.ObjectId(id));
    const projects = await projectsCollection.find({
      userId: { $in: validUserIds }
    }).toArray();

    console.log(`📊 Проектов: ${projects.length}`);

    // Загружаем гипотезы
    const hypothesesCollection = db.collection('projectHypotheses');
    const projectIds = projects.map(p => p._id);
    const hypotheses = await hypothesesCollection.find({
      projectId: { $in: projectIds }
    }).toArray();

    console.log(`📊 Гипотез: ${hypotheses.length}`);

    // Загружаем Lean Canvas
    const coresCollection = db.collection('hypothesesCores');
    const hypothesisIds = hypotheses.map(h => h._id);
    const cores = await coresCollection.find({
      projectHypothesisId: { $in: hypothesisIds }
    }).toArray();

    console.log(`📊 Lean Canvas: ${cores.length}`);

    // Загружаем ICP профили
    const icpCollection = db.collection('hypothesesPersonProfiles');
    const icpProfiles = await icpCollection.find({
      projectHypothesisId: { $in: hypothesisIds }
    }).toArray();

    console.log(`📊 ICP профилей: ${icpProfiles.length}`);

    // Загружаем GTM стратегии
    const gtmCollection = db.collection('hypothesesGtms');
    const gtms = await gtmCollection.find({
      userId: { $in: validUserIds }
    }).toArray();

    console.log(`📊 GTM стратегий: ${gtms.length}\n`);

    // Создаем структуру данных
    const data = {
      exportDate: new Date().toISOString(),
      database: db.databaseName,
      summary: {
        totalValidUsers: validUsers.size,
        totalProjects: projects.length,
        totalHypotheses: hypotheses.length,
        totalLeanCanvas: cores.length,
        totalIcpProfiles: icpProfiles.length,
        totalGtmStrategies: gtms.length,
        usersWithProjects: new Set(projects.map(p => p.userId.toString())).size,
        usersWithHypotheses: new Set(hypotheses.map(h => h.userId.toString())).size,
        usersWithGtm: new Set(gtms.map(g => g.userId.toString())).size,
        hypothesesWithLeanCanvas: new Set(cores.map(c => c.projectHypothesisId.toString())).size,
        hypothesesWithIcp: new Set(icpProfiles.map(i => i.projectHypothesisId.toString())).size,
        hypothesesWithGtm: new Set(gtms.map(g => g.projectHypothesisId.toString())).size
      },
      projects: projects.map(project => {
        const projectHypotheses = hypotheses.filter(h => h.projectId.toString() === project._id.toString());
        
        return {
          id: project._id.toString(),
          userId: project.userId.toString(),
          userEmail: validUsers.get(project.userId.toString())?.email || 'unknown',
          title: project.title,
          generationStatus: project.generationStatus,
          startType: project.startType,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          hypotheses: projectHypotheses.map(hypothesis => {
            const hypothesisId = hypothesis._id.toString();
            const core = cores.find(c => c.projectHypothesisId.toString() === hypothesisId);
            const icp = icpProfiles.filter(i => i.projectHypothesisId.toString() === hypothesisId);
            const gtm = gtms.find(g => g.projectHypothesisId.toString() === hypothesisId);

            return {
              id: hypothesisId,
              title: hypothesis.title,
              description: hypothesis.description,
              createdAt: hypothesis.createdAt,
              updatedAt: hypothesis.updatedAt,
              hasLeanCanvas: !!core,
              hasIcp: icp.length > 0,
              icpCount: icp.length,
              hasGtm: !!gtm,
              gtmId: gtm?._id.toString()
            };
          })
        };
      })
    };

    // Сохраняем в JSON файл
    const outputDir = path.join(process.cwd(), 'logs', 'backups', 'analysis');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `project-hypothesis-gtm-export-${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');

    console.log(`\n✅ Данные экспортированы в: ${filepath}`);
    console.log(`\n📊 Сводка:`);
    console.log(`   Пользователей с проектами: ${data.summary.usersWithProjects}`);
    console.log(`   Пользователей с гипотезами: ${data.summary.usersWithHypotheses}`);
    console.log(`   Пользователей с GTM: ${data.summary.usersWithGtm}`);
    console.log(`   Гипотез с Lean Canvas: ${data.summary.hypothesesWithLeanCanvas}`);
    console.log(`   Гипотез с ICP: ${data.summary.hypothesesWithIcp}`);
    console.log(`   Гипотез с GTM: ${data.summary.hypothesesWithGtm}`);

    // Конверсия
    const gtmConversionRate = data.summary.usersWithProjects > 0
      ? (data.summary.usersWithGtm / data.summary.usersWithProjects * 100).toFixed(1)
      : '0.0';
    
    const hypothesisGtmRate = data.summary.hypothesesWithLeanCanvas > 0
      ? (data.summary.hypothesesWithGtm / data.summary.hypothesesWithLeanCanvas * 100).toFixed(1)
      : '0.0';

    console.log(`\n🎯 Конверсия:`);
    console.log(`   Пользователей с GTM: ${data.summary.usersWithGtm} из ${data.summary.usersWithProjects} (${gtmConversionRate}%)`);
    console.log(`   Гипотез с GTM: ${data.summary.hypothesesWithGtm} из ${data.summary.hypothesesWithLeanCanvas} (${hypothesisGtmRate}%)`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Соединение закрыто');
  }
}

exportData();




