/**
 * Скрипт для обновления промокода
 * 
 * Использование:
 * node update-promo-code.js <code> [maxUses] [isActive] [expiresAt]
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI не найден в .env файле');
    process.exit(1);
}

const promoCodeSchema = new mongoose.Schema({}, { strict: false, collection: 'promocodes' });
const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

async function updatePromoCode(code, maxUses, isActive, expiresAt) {
    try {
        console.log('🔌 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        const updateData = {
            updatedAt: new Date(),
        };

        if (maxUses !== undefined) {
            updateData.maxUses = parseInt(maxUses);
        }

        if (isActive !== undefined) {
            updateData.isActive = isActive === 'true' || isActive === true;
        }

        if (expiresAt !== undefined) {
            if (expiresAt === 'null' || expiresAt === '') {
                updateData.$unset = { expiresAt: '' };
            } else {
                updateData.expiresAt = new Date(expiresAt);
            }
        }

        const result = await PromoCode.updateOne(
            { code: code.toUpperCase() },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            console.error(`❌ Промокод ${code.toUpperCase()} не найден`);
            await mongoose.disconnect();
            process.exit(1);
        }

        const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });

        console.log(`\n✅ Промокод обновлен:`);
        console.log(`   Код: ${promoCode.code}`);
        console.log(`   Тип подписки: ${promoCode.subscriptionType}`);
        console.log(`   Длительность: ${promoCode.durationMonths} месяцев`);
        console.log(`   Максимум использований: ${promoCode.maxUses}`);
        console.log(`   Использовано: ${promoCode.usedCount}`);
        console.log(`   Активен: ${promoCode.isActive}`);
        if (promoCode.expiresAt) {
            console.log(`   Истекает: ${promoCode.expiresAt}`);
        } else {
            console.log(`   Истекает: никогда`);
        }

        await mongoose.disconnect();
        console.log('\n🔌 Отключено от MongoDB');
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

const args = process.argv.slice(2);

if (args.length < 1) {
    console.error('❌ Укажите код промокода');
    console.log('\nИспользование:');
    console.log('  node update-promo-code.js <code> [maxUses] [isActive] [expiresAt]');
    console.log('\nПримеры:');
    console.log('  node update-promo-code.js PRO1 1000');
    console.log('  node update-promo-code.js PRO1 1000 true');
    console.log('  node update-promo-code.js PRO1 1000 true "2025-12-31"');
    process.exit(1);
}

const [code, maxUses, isActive, expiresAt] = args;

updatePromoCode(code, maxUses, isActive, expiresAt);






