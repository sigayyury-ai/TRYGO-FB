/**
 * Скрипт для проверки миграции промокодов из тестовой базы в прод
 * 
 * Проверяет:
 * 1. Наличие промокодов в тестовой базе (test)
 * 2. Наличие промокодов в продовой базе (trygo)
 * 3. Сравнивает их и показывает, какие промокоды отсутствуют в проде
 * 
 * Использование:
 * node scripts/check-promocode-migration.js
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

if (!MONGODB_URI) {
    console.error('❌ MONGO_URI или MONGODB_URI не найден в .env файле');
    process.exit(1);
}

// Создаем URI для тестовой и продовой баз
const getDatabaseUri = (dbName) => {
    return MONGODB_URI.replace(/\/[^/]+(\?|$)/, `/${dbName}$1`);
};

const TEST_URI = getDatabaseUri('test');
const PROD_URI = getDatabaseUri('trygo');

// Схема промокода
const promoCodeSchema = new mongoose.Schema({}, { strict: false, collection: 'promocodes' });

async function checkPromocodeMigration() {
    let testConnection, prodConnection;
    
    try {
        console.log('🔍 Проверка миграции промокодов из test в trygo...\n');

        // Подключение к тестовой базе
        console.log('🔌 Подключение к тестовой базе (test)...');
        testConnection = await mongoose.createConnection(TEST_URI).asPromise();
        console.log('✅ Подключено к тестовой базе\n');

        // Подключение к продовой базе
        console.log('🔌 Подключение к продовой базе (trygo)...');
        prodConnection = await mongoose.createConnection(PROD_URI).asPromise();
        console.log('✅ Подключено к продовой базе\n');

        const TestPromoCode = testConnection.model('PromoCode', promoCodeSchema, 'promocodes');
        const ProdPromoCode = prodConnection.model('PromoCode', promoCodeSchema, 'promocodes');

        // Получаем все промокоды из тестовой базы
        console.log('📊 Получение промокодов из тестовой базы...');
        const testPromocodes = await TestPromoCode.find({}).lean().exec();
        console.log(`✅ Найдено промокодов в тестовой базе: ${testPromocodes.length}\n`);

        // Получаем все промокоды из продовой базы
        console.log('📊 Получение промокодов из продовой базы...');
        const prodPromocodes = await ProdPromoCode.find({}).lean().exec();
        console.log(`✅ Найдено промокодов в продовой базе: ${prodPromocodes.length}\n`);

        // Создаем мапы по коду для быстрого поиска
        const testPromocodesMap = new Map();
        testPromocodes.forEach(pc => {
            testPromocodesMap.set(pc.code, pc);
        });

        const prodPromocodesMap = new Map();
        prodPromocodes.forEach(pc => {
            prodPromocodesMap.set(pc.code, pc);
        });

        // Находим промокоды, которые есть в тесте, но отсутствуют в проде
        const missingInProd = [];
        testPromocodesMap.forEach((testPc, code) => {
            if (!prodPromocodesMap.has(code)) {
                missingInProd.push(testPc);
            }
        });

        // Находим промокоды, которые есть только в проде
        const onlyInProd = [];
        prodPromocodesMap.forEach((prodPc, code) => {
            if (!testPromocodesMap.has(code)) {
                onlyInProd.push(prodPc);
            }
        });

        // Выводим результаты
        console.log('='.repeat(80));
        console.log('📋 РЕЗУЛЬТАТЫ ПРОВЕРКИ');
        console.log('='.repeat(80));
        console.log(`\n📊 Статистика:`);
        console.log(`   Тестовая база (test): ${testPromocodes.length} промокодов`);
        console.log(`   Продовая база (trygo): ${prodPromocodes.length} промокодов`);

        if (testPromocodes.length > 0) {
            console.log(`\n📝 Промокоды в тестовой базе:`);
            testPromocodes.forEach(pc => {
                console.log(`   - ${pc.code} (${pc.subscriptionType}, ${pc.durationMonths} мес., использовано: ${pc.usedCount}/${pc.maxUses}, активен: ${pc.isActive})`);
            });
        }

        if (prodPromocodes.length > 0) {
            console.log(`\n📝 Промокоды в продовой базе:`);
            prodPromocodes.forEach(pc => {
                console.log(`   - ${pc.code} (${pc.subscriptionType}, ${pc.durationMonths} мес., использовано: ${pc.usedCount}/${pc.maxUses}, активен: ${pc.isActive})`);
            });
        }

        if (missingInProd.length > 0) {
            console.log(`\n❌ ПРОМОКОДЫ, ОТСУТСТВУЮЩИЕ В ПРОДЕ (${missingInProd.length}):`);
            missingInProd.forEach(pc => {
                console.log(`   - ${pc.code} (${pc.subscriptionType}, ${pc.durationMonths} мес.)`);
            });
            console.log(`\n⚠️  ВНИМАНИЕ: Эти промокоды нужно перенести из test в trygo!`);
        } else {
            console.log(`\n✅ Все промокоды из тестовой базы присутствуют в проде!`);
        }

        if (onlyInProd.length > 0) {
            console.log(`\nℹ️  Промокоды, которые есть только в проде (${onlyInProd.length}):`);
            onlyInProd.forEach(pc => {
                console.log(`   - ${pc.code} (${pc.subscriptionType}, ${pc.durationMonths} мес.)`);
            });
        }

        // Проверяем совпадения
        if (testPromocodes.length > 0 && missingInProd.length === 0) {
            console.log(`\n✅ МИГРАЦИЯ ЗАВЕРШЕНА: Все промокоды из теста присутствуют в проде!`);
        } else if (testPromocodes.length === 0) {
            console.log(`\nℹ️  В тестовой базе нет промокодов для миграции.`);
        } else {
            console.log(`\n❌ МИГРАЦИЯ НЕ ЗАВЕРШЕНА: Нужно перенести ${missingInProd.length} промокодов.`);
        }

        console.log('\n' + '='.repeat(80));

    } catch (error) {
        console.error('❌ Ошибка при проверке миграции:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        // Закрываем соединения
        if (testConnection) {
            await testConnection.close();
            console.log('\n🔌 Соединение с тестовой базой закрыто');
        }
        if (prodConnection) {
            await prodConnection.close();
            console.log('🔌 Соединение с продовой базой закрыто');
        }
        process.exit(0);
    }
}

checkPromocodeMigration();
