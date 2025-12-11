#!/usr/bin/env node

/**
 * Скрипт для проверки статистики GTM стратегий в базе данных
 * 
 * Использование:
 *   node scripts/check_gtm_stats.mjs
 * 
 * Требует переменную окружения MONGODB_URI
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Получаем MONGODB_URI и заменяем имя базы данных на 'test'
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Ошибка: MONGODB_URI не установлена в переменных окружения');
  console.error('   Убедитесь, что файл .env содержит MONGODB_URI');
  process.exit(1);
}

// Заменяем имя базы данных на 'test'
MONGODB_URI = MONGODB_URI.replace(/\/[^/?]+(\?|$)/, '/test$1');
console.log(`🔗 Подключение к базе данных: test\n`);

async function checkGtmStats() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`✅ Подключено к базе данных: ${dbName}\n`);
    
    // Проверяем, существует ли коллекция hypothesesGtms
    const collections = await db.listCollections().toArray();
    const gtmCollectionExists = collections.some(col => col.name === 'hypothesesGtms');
    
    if (!gtmCollectionExists) {
      console.log('⚠️  Коллекция hypothesesGtms не найдена в базе данных');
      console.log('\nДоступные коллекции:');
      collections.forEach(col => console.log(`  - ${col.name}`));
      await mongoose.disconnect();
      return;
    }

    const gtmCollection = db.collection('hypothesesGtms');
    
    // Общее количество GTM стратегий
    const totalGtm = await gtmCollection.countDocuments();
    console.log(`📊 Общее количество GTM стратегий: ${totalGtm}`);

    if (totalGtm === 0) {
      console.log('\n⚠️  В базе данных нет GTM стратегий');
      await mongoose.disconnect();
      return;
    }

    // Уникальные пользователи с GTM стратегиями
    const uniqueUsers = await gtmCollection.distinct('userId');
    console.log(`👥 Уникальных пользователей с GTM стратегиями: ${uniqueUsers.length}`);

    // Уникальные гипотезы с GTM стратегиями
    const uniqueHypotheses = await gtmCollection.distinct('projectHypothesisId');
    console.log(`💡 Уникальных гипотез с GTM стратегиями: ${uniqueHypotheses.length}`);

    // Загружаем данные о пользователях для фильтрации тестовых
    const usersCollection = db.collection('users');
    const allUsers = await usersCollection.find({}).toArray();
    
    // Фильтруем тестовых пользователей
    const testPatterns = [
      /sigayyury\d+@gmail\.com/i,
      /sigayyury3@gmail\.com/i,
      /avelmolodecfda\+\d+@gmail\.com/i,
      /.*test.*/i
    ];

    const validUserIds = new Set();
    const validUserObjectIds = [];
    allUsers.forEach(user => {
      const email = user.email || '';
      const isTest = testPatterns.some(pattern => pattern.test(email)) || !email;
      if (!isTest) {
        validUserIds.add(user._id.toString());
        validUserObjectIds.push(user._id);
      }
    });

    console.log(`\n🔍 Фильтрация тестовых пользователей:`);
    console.log(`   Всего пользователей: ${allUsers.length}`);
    console.log(`   Валидных пользователей: ${validUserIds.size}`);
    console.log(`   Тестовых пользователей: ${allUsers.length - validUserIds.size}`);

    // Проверяем, какие пользователи создали GTM стратегии
    const allGtm = await gtmCollection.find({}).toArray();
    const gtmUserIds = new Set(allGtm.map(gtm => gtm.userId?.toString()).filter(Boolean));
    
    console.log(`\n🔍 Анализ пользователей с GTM стратегиями:`);
    console.log(`   Всего уникальных пользователей с GTM: ${gtmUserIds.size}`);
    
    // Проверяем, сколько из них тестовые
    const testGtmUsers = [];
    const validGtmUsers = [];
    
    for (const userId of gtmUserIds) {
      const user = allUsers.find(u => u._id.toString() === userId);
      if (user) {
        const email = user.email || '';
        const isTest = testPatterns.some(pattern => pattern.test(email)) || !email;
        if (isTest) {
          testGtmUsers.push({ userId, email });
        } else {
          validGtmUsers.push({ userId, email });
        }
      }
    }
    
    console.log(`   Тестовых пользователей с GTM: ${testGtmUsers.length}`);
    console.log(`   Валидных пользователей с GTM: ${validGtmUsers.length}`);
    
    if (testGtmUsers.length > 0 && testGtmUsers.length <= 5) {
      console.log(`\n   Примеры тестовых пользователей с GTM:`);
      testGtmUsers.forEach(u => console.log(`     - ${u.email || u.userId}`));
    }

    // Фильтруем GTM стратегии по валидным пользователям
    // Используем ObjectId для корректного поиска
    const validGtm = await gtmCollection.find({
      userId: { $in: validUserObjectIds }
    }).toArray();

    const validGtmCount = validGtm.length;
    const validUniqueUsers = new Set(validGtm.map(gtm => gtm.userId?.toString()).filter(Boolean));
    const validUniqueHypotheses = new Set(validGtm.map(gtm => gtm.projectHypothesisId?.toString()).filter(Boolean));

    console.log(`\n📈 Статистика GTM стратегий (без тестовых пользователей):`);
    console.log(`   Всего GTM стратегий: ${validGtmCount}`);
    console.log(`   Уникальных пользователей: ${validUniqueUsers.size}`);
    console.log(`   Уникальных гипотез: ${validUniqueHypotheses.size}`);

    // Загружаем данные о валидных пользователях для расчета процента
    const validUsersCount = validUserIds.size;
    const gtmConversionRate = validUsersCount > 0 
      ? (validUniqueUsers.size / validUsersCount * 100).toFixed(1)
      : '0.0';

    console.log(`\n🎯 Конверсия:`);
    console.log(`   Пользователей с GTM стратегиями: ${validUniqueUsers.size} из ${validUsersCount}`);
    console.log(`   Конверсия: ${gtmConversionRate}%`);

    // Статистика по гипотезам
    const hypothesesCollection = db.collection('projectHypotheses');
    const validHypotheses = await hypothesesCollection.find({
      userId: { $in: validUserObjectIds }
    }).toArray();
    
    const validHypothesesCount = validHypotheses.length;
    const gtmHypothesesRate = validHypothesesCount > 0
      ? (validUniqueHypotheses.size / validHypothesesCount * 100).toFixed(1)
      : '0.0';

    console.log(`\n💡 Конверсия гипотез:`);
    console.log(`   Гипотез с GTM стратегиями: ${validUniqueHypotheses.size} из ${validHypothesesCount}`);
    console.log(`   Конверсия: ${gtmHypothesesRate}%`);

    // Среднее количество GTM стратегий на пользователя
    if (validUniqueUsers.size > 0) {
      const avgGtmPerUser = (validGtmCount / validUniqueUsers.size).toFixed(2);
      console.log(`\n📊 Среднее количество GTM стратегий на пользователя: ${avgGtmPerUser}`);
    }

  } catch (error) {
    console.error('❌ Ошибка при запросе к базе данных:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Соединение закрыто');
  }
}

checkGtmStats();

