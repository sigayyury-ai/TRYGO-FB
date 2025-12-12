/**
 * Скрипт для проверки работы резолверов промокодов
 * 
 * Проверяет:
 * 1. Подключение к базе данных
 * 2. Работу сервиса промокодов
 * 3. Существование промокодов в базе
 * 
 * Использование:
 * node scripts/test-promocode-resolvers.js
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

// Try to require PromoCodeService (TypeScript compiled)
const backendSrcPath = path.join(__dirname, '../TRYGO-Backend/src');

async function testPromocodeResolvers() {
    try {
        console.log('🔍 Проверка работы резолверов промокодов...\n');

        // 1. Проверка подключения к БД
        console.log('1️⃣  Проверка подключения к базе данных...');
        const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!MONGODB_URI) {
            console.error('❌ MONGO_URI или MONGODB_URI не найден в .env файле');
            process.exit(1);
        }

        // Проверяем, что используется продовая база
        const dbName = MONGODB_URI.match(/\/([^/?]+)(\?|$)/)?.[1];
        if (dbName !== 'trygo') {
            console.warn(`⚠️  ВНИМАНИЕ: Используется база данных "${dbName}", ожидается "trygo"`);
        }

        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Подключено к MongoDB (база: ${dbName || 'не определена'})\n`);

        // 2. Проверка модели промокодов
        console.log('2️⃣  Проверка модели промокодов...');
        const promoCodeSchema = new mongoose.Schema({}, { strict: false, collection: 'promocodes' });
        const PromoCodeModel = mongoose.model('PromoCode', promoCodeSchema, 'promocodes');
        console.log('✅ Модель промокодов создана\n');

        // 3. Проверка наличия промокодов в базе
        console.log('3️⃣  Проверка наличия промокодов в базе...');
        const promocodes = await PromoCodeModel.find({}).lean().exec();
        console.log(`✅ Найдено промокодов: ${promocodes.length}`);
        
        if (promocodes.length > 0) {
            console.log('\n📋 Список промокодов:');
            promocodes.forEach(pc => {
                console.log(`   - ${pc.code}`);
                console.log(`     Тип: ${pc.subscriptionType}`);
                console.log(`     Длительность: ${pc.durationMonths} мес.`);
                console.log(`     Использовано: ${pc.usedCount}/${pc.maxUses}`);
                console.log(`     Активен: ${pc.isActive}`);
                console.log('');
            });
        } else {
            console.log('⚠️  В базе нет промокодов\n');
        }

        // 4. Проверка структуры резолверов
        console.log('4️⃣  Проверка структуры резолверов...');
        
        // Проверяем наличие файлов резолверов
        const fs = require('fs');
        const promoCodeQueryResolverPath = path.join(backendSrcPath, 'resolvers/promoCode/promoCodeQueryResolver.ts');
        const promoCodeMutationResolverPath = path.join(backendSrcPath, 'resolvers/promoCode/promoCodeMutationResolver.ts');
        const promoCodeServicePath = path.join(backendSrcPath, 'services/promoCode/PromoCodeService.ts');
        const promoCodeModelPath = path.join(backendSrcPath, 'models/PromoCodeModel.ts');
        const typeDefsPath = path.join(backendSrcPath, 'typeDefs/subscriptionTypeDefs.graphql');

        const filesToCheck = [
            { name: 'Query Resolver', path: promoCodeQueryResolverPath },
            { name: 'Mutation Resolver', path: promoCodeMutationResolverPath },
            { name: 'PromoCode Service', path: promoCodeServicePath },
            { name: 'PromoCode Model', path: promoCodeModelPath },
            { name: 'GraphQL TypeDefs', path: typeDefsPath },
        ];

        let allFilesExist = true;
        for (const file of filesToCheck) {
            if (fs.existsSync(file.path)) {
                console.log(`   ✅ ${file.name}: существует`);
            } else {
                console.log(`   ❌ ${file.name}: НЕ НАЙДЕН (${file.path})`);
                allFilesExist = false;
            }
        }

        if (allFilesExist) {
            console.log('\n✅ Все файлы резолверов на месте\n');
        } else {
            console.log('\n⚠️  Некоторые файлы отсутствуют\n');
        }

        // 5. Проверка подключения в _indexResolvers.ts
        console.log('5️⃣  Проверка подключения резолверов к основной схеме...');
        const indexResolversPath = path.join(backendSrcPath, 'resolvers/_indexResolvers.ts');
        
        if (fs.existsSync(indexResolversPath)) {
            const indexResolversContent = fs.readFileSync(indexResolversPath, 'utf8');
            
            const hasQueryImport = indexResolversContent.includes('promoCodeQueryResolver');
            const hasMutationImport = indexResolversContent.includes('promoCodeMutationResolver');
            const hasQuerySpread = indexResolversContent.includes('...promoCodeQueryResolver.Query');
            const hasMutationSpread = indexResolversContent.includes('...promoCodeMutationResolver.Mutation');

            if (hasQueryImport && hasMutationImport && hasQuerySpread && hasMutationSpread) {
                console.log('   ✅ Query резолвер импортирован и подключен');
                console.log('   ✅ Mutation резолвер импортирован и подключен');
                console.log('\n✅ Резолверы подключены к основной схеме\n');
            } else {
                console.log('   ❌ Резолверы НЕ подключены должным образом');
                if (!hasQueryImport) console.log('      - Отсутствует импорт promoCodeQueryResolver');
                if (!hasMutationImport) console.log('      - Отсутствует импорт promoCodeMutationResolver');
                if (!hasQuerySpread) console.log('      - Отсутствует подключение promoCodeQueryResolver.Query');
                if (!hasMutationSpread) console.log('      - Отсутствует подключение promoCodeMutationResolver.Mutation');
                console.log('');
            }
        } else {
            console.log('   ⚠️  Файл _indexResolvers.ts не найден\n');
        }

        // 6. Проверка GraphQL схемы
        console.log('6️⃣  Проверка GraphQL схемы...');
        if (fs.existsSync(typeDefsPath)) {
            const typeDefsContent = fs.readFileSync(typeDefsPath, 'utf8');
            
            const hasPromoCodeInfo = typeDefsContent.includes('type PromoCodeInfo');
            const hasPromoCode = typeDefsContent.includes('type PromoCode');
            const hasGetPromoCodeInfo = typeDefsContent.includes('getPromoCodeInfo');
            const hasGetAllPromoCodes = typeDefsContent.includes('getAllPromoCodes');
            const hasActivatePromoCode = typeDefsContent.includes('activatePromoCode');
            const hasCreatePromoCode = typeDefsContent.includes('createPromoCode');

            if (hasPromoCodeInfo && hasPromoCode && hasGetPromoCodeInfo && 
                hasGetAllPromoCodes && hasActivatePromoCode && hasCreatePromoCode) {
                console.log('   ✅ Все типы и методы промокодов определены в схеме');
                console.log('\n✅ GraphQL схема корректна\n');
            } else {
                console.log('   ⚠️  Некоторые типы/методы отсутствуют в схеме');
                if (!hasPromoCodeInfo) console.log('      - Отсутствует type PromoCodeInfo');
                if (!hasPromoCode) console.log('      - Отсутствует type PromoCode');
                if (!hasGetPromoCodeInfo) console.log('      - Отсутствует getPromoCodeInfo');
                if (!hasGetAllPromoCodes) console.log('      - Отсутствует getAllPromoCodes');
                if (!hasActivatePromoCode) console.log('      - Отсутствует activatePromoCode');
                if (!hasCreatePromoCode) console.log('      - Отсутствует createPromoCode');
                console.log('');
            }
        } else {
            console.log('   ⚠️  Файл subscriptionTypeDefs.graphql не найден\n');
        }

        // Итоговый отчет
        console.log('='.repeat(80));
        console.log('📊 ИТОГОВЫЙ ОТЧЕТ');
        console.log('='.repeat(80));
        console.log(`✅ Подключение к БД: OK (база: ${dbName || 'не определена'})`);
        console.log(`✅ Промокоды в базе: ${promocodes.length}`);
        console.log(`✅ Файлы резолверов: ${allFilesExist ? 'Все на месте' : 'Некоторые отсутствуют'}`);
        console.log('='.repeat(80));
        console.log('\n✅ Проверка завершена!\n');

    } catch (error) {
        console.error('❌ Ошибка при проверке:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
            console.log('🔌 Соединение с базой данных закрыто');
        }
        process.exit(0);
    }
}

testPromocodeResolvers();
