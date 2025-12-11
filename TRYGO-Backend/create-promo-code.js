/**
 * Скрипт для создания промокодов
 * 
 * Использование:
 * node create-promo-code.js <code> <type> [durationMonths] [maxUses] [expiresAt]
 * 
 * Примеры:
 * node create-promo-code.js PRO2024 PRO 12 100
 * node create-promo-code.js PRO2024 PRO 12 1 "2025-12-31"
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI не найден в .env файле');
    process.exit(1);
}

// Схема промокода
const promoCodeSchema = new mongoose.Schema({}, { strict: false, collection: 'promocodes' });
const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

async function createPromoCode(code, type, durationMonths = 12, maxUses = 1, expiresAt = null) {
    try {
        console.log('🔌 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        // Проверить, существует ли уже промокод
        const existing = await PromoCode.findOne({ code: code.toUpperCase() });
        if (existing) {
            console.error(`❌ Промокод ${code.toUpperCase()} уже существует`);
            await mongoose.disconnect();
            process.exit(1);
        }

        // Создать промокод
        const promoCodeData = {
            code: code.toUpperCase(),
            subscriptionType: type.toUpperCase(),
            durationMonths: parseInt(durationMonths),
            maxUses: parseInt(maxUses),
            usedCount: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (expiresAt) {
            promoCodeData.expiresAt = new Date(expiresAt);
        }

        const promoCode = await PromoCode.create(promoCodeData);

        console.log(`\n✅ Промокод создан:`);
        console.log(`   Код: ${promoCode.code}`);
        console.log(`   Тип подписки: ${promoCode.subscriptionType}`);
        console.log(`   Длительность: ${promoCode.durationMonths} месяцев`);
        console.log(`   Максимум использований: ${promoCode.maxUses}`);
        console.log(`   Использовано: ${promoCode.usedCount}`);
        if (promoCode.expiresAt) {
            console.log(`   Истекает: ${promoCode.expiresAt}`);
        } else {
            console.log(`   Истекает: никогда`);
        }
        console.log(`   ID: ${promoCode._id}`);

        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Получить аргументы из командной строки
const args = process.argv.slice(2);

if (args.length < 2) {
    console.error('❌ Недостаточно аргументов');
    console.log('\nИспользование:');
    console.log('  node create-promo-code.js <code> <type> [durationMonths] [maxUses] [expiresAt]');
    console.log('\nПараметры:');
    console.log('  code          - Код промокода (например, PRO2024)');
    console.log('  type          - Тип подписки (PRO или STARTER)');
    console.log('  durationMonths - Длительность в месяцах (по умолчанию: 12)');
    console.log('  maxUses       - Максимум использований (по умолчанию: 1)');
    console.log('  expiresAt     - Дата истечения (формат: YYYY-MM-DD, опционально)');
    console.log('\nПримеры:');
    console.log('  node create-promo-code.js PRO2024 PRO 12 100');
    console.log('  node create-promo-code.js PRO2024 PRO 12 1 "2025-12-31"');
    console.log('  node create-promo-code.js STARTER2024 STARTER 6 50');
    process.exit(1);
}

const [code, type, durationMonths, maxUses, expiresAt] = args;

if (type.toUpperCase() !== 'PRO' && type.toUpperCase() !== 'STARTER') {
    console.error('❌ Тип подписки должен быть PRO или STARTER');
    process.exit(1);
}

createPromoCode(code, type, durationMonths, maxUses, expiresAt);

