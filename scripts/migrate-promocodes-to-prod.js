/**
 * Скрипт для миграции промокодов из тестовой базы в прод
 * 
 * Выполняет:
 * 1. Подключается к тестовой базе (test)
 * 2. Подключается к продовой базе (trygo)
 * 3. Копирует все промокоды из test в trygo
 * 4. Пропускает промокоды, которые уже существуют в trygo (по коду)
 * 
 * Использование:
 * FORCE=true node scripts/migrate-promocodes-to-prod.js
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

async function migratePromocodes() {
    const force = process.env.FORCE === 'true';
    if (!force) {
        console.error('❌ Для безопасности установите FORCE=true');
        console.log('Использование: FORCE=true node scripts/migrate-promocodes-to-prod.js');
        process.exit(1);
    }

    let testConnection, prodConnection;
    
    try {
        console.log('🚀 Миграция промокодов из test в trygo...\n');

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

        if (testPromocodes.length === 0) {
            console.log('ℹ️  В тестовой базе нет промокодов для миграции.');
            return;
        }

        // Получаем существующие промокоды из продовой базы
        console.log('📊 Проверка существующих промокодов в продовой базе...');
        const prodPromocodes = await ProdPromoCode.find({}).lean().exec();
        const existingCodes = new Set(prodPromocodes.map(pc => pc.code));
        console.log(`✅ Найдено промокодов в продовой базе: ${prodPromocodes.length}\n`);

        // Фильтруем промокоды, которые нужно мигрировать
        const toMigrate = testPromocodes.filter(pc => !existingCodes.has(pc.code));
        const skipped = testPromocodes.filter(pc => existingCodes.has(pc.code));

        if (toMigrate.length === 0) {
            console.log('✅ Все промокоды уже присутствуют в продовой базе. Миграция не требуется.\n');
            return;
        }

        console.log(`📋 К миграции: ${toMigrate.length} промокодов`);
        if (skipped.length > 0) {
            console.log(`⏭️  Пропущено (уже существуют): ${skipped.length} промокодов\n`);
        }

        // Мигрируем промокоды
        console.log('🔄 Начало миграции...\n');
        let migratedCount = 0;
        let errorCount = 0;

        for (const promoCode of toMigrate) {
            try {
                // Удаляем _id, чтобы MongoDB создал новый
                const { _id, __v, ...promoCodeData } = promoCode;
                
                // Создаем промокод в продовой базе
                await ProdPromoCode.create(promoCodeData);
                migratedCount++;
                console.log(`   ✅ Мигрирован: ${promoCode.code} (${promoCode.subscriptionType}, ${promoCode.durationMonths} мес.)`);
            } catch (error) {
                errorCount++;
                console.error(`   ❌ Ошибка при миграции ${promoCode.code}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 ИТОГИ МИГРАЦИИ');
        console.log('='.repeat(80));
        console.log(`✅ Успешно мигрировано: ${migratedCount}`);
        if (errorCount > 0) {
            console.log(`❌ Ошибок: ${errorCount}`);
        }
        if (skipped.length > 0) {
            console.log(`⏭️  Пропущено (уже существуют): ${skipped.length}`);
        }
        console.log('='.repeat(80) + '\n');

        if (migratedCount > 0) {
            console.log('✅ Миграция завершена успешно!');
        }

    } catch (error) {
        console.error('❌ Ошибка при миграции:', error.message);
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

migratePromocodes();
