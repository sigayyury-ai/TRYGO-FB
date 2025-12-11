#!/usr/bin/env node

/**
 * Скрипт для проверки статистики GTM стратегий в базе данных
 * 
 * Использование:
 *   node scripts/check_gtm_stats.js
 * 
 * Требует переменную окружения MONGODB_URI
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Ошибка: MONGODB_URI не установлена в переменных окружения');
  process.exit(1);
}

async function checkGtmStats() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Подключено к базе данных\n');

    const db = client.db();
    
    // Проверяем, существует ли коллекция hypothesesGtm
    const collections = await db.listCollections().toArray();
    const gtmCollectionExists = collections.some(col => col.name === 'hypothesesGtm');
    
    if (!gtmCollectionExists) {
      console.log('⚠️  Коллекция hypothesesGtm не найдена в базе данных');
      console.log('\nДоступные коллекции:');
      collections.forEach(col => console.log(`  - ${col.name}`));
      return;
    }

    const gtmCollection = db.collection('hypothesesGtm');
    
    // Общее количество GTM стратегий
    const totalGtm = await gtmCollection.countDocuments();
    console.log(`📊 Общее количество GTM стратегий: ${totalGtm}`);

    if (totalGtm === 0) {
      console.log('\n⚠️  В базе данных нет GTM стратегий');
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
    allUsers.forEach(user => {
      const email = user.email || '';
      const isTest = testPatterns.some(pattern => pattern.test(email)) || !email;
      if (!isTest) {
        validUserIds.add(user._id.toString());
      }
    });

    console.log(`\n🔍 Фильтрация тестовых пользователей:`);
    console.log(`   Всего пользователей: ${allUsers.length}`);
    console.log(`   Валидных пользователей: ${validUserIds.size}`);
    console.log(`   Тестовых пользователей: ${allUsers.length - validUserIds.size}`);

    // Фильтруем GTM стратегии по валидным пользователям
    const validGtm = await gtmCollection.find({
      userId: { $in: Array.from(validUserIds) }
    }).toArray();

    const validGtmCount = validGtm.length;
    const validUniqueUsers = new Set(validGtm.map(gtm => gtm.userId.toString()));
    const validUniqueHypotheses = new Set(validGtm.map(gtm => gtm.projectHypothesisId?.toString()));

    console.log(`\n📈 Статистика GTM стратегий (без тестовых пользователей):`);
    console.log(`   Всего GTM стратегий: ${validGtmCount}`);
    console.log(`   Уникальных пользователей: ${validUniqueUsers.size}`);
    console.log(`   Уникальных гипотез: ${validUniqueHypotheses.size}`);

    // Загружаем данные о валидных пользователях для расчета процента
    const validUsersCount = validUserIds.size;
    const gtmConversionRate = (validUniqueUsers.size / validUsersCount * 100).toFixed(1);

    console.log(`\n🎯 Конверсия:`);
    console.log(`   Пользователей с GTM стратегиями: ${validUniqueUsers.size} из ${validUsersCount}`);
    console.log(`   Конверсия: ${gtmConversionRate}%`);

    // Статистика по гипотезам
    const hypothesesCollection = db.collection('projectHypotheses');
    const validHypotheses = await hypothesesCollection.find({
      userId: { $in: Array.from(validUserIds) }
    }).toArray();
    
    const validHypothesesCount = validHypotheses.length;
    const gtmHypothesesRate = (validUniqueHypotheses.size / validHypothesesCount * 100).toFixed(1);

    console.log(`\n💡 Конверсия гипотез:`);
    console.log(`   Гипотез с GTM стратегиями: ${validUniqueHypotheses.size} из ${validHypothesesCount}`);
    console.log(`   Конверсия: ${gtmHypothesesRate}%`);

    // Среднее количество GTM стратегий на пользователя
    const avgGtmPerUser = (validGtmCount / validUniqueUsers.size).toFixed(2);
    console.log(`\n📊 Среднее количество GTM стратегий на пользователя: ${avgGtmPerUser}`);

  } catch (error) {
    console.error('❌ Ошибка при запросе к базе данных:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Соединение закрыто');
  }
}

checkGtmStats();




