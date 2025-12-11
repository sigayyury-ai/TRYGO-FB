/**
 * Скрипт для добавления PRO подписки пользователю напрямую в БД
 * 
 * Использование:
 * node add-pro-subscription.js <userEmail>
 * 
 * Или через MongoDB напрямую:
 * 1. Подключитесь к MongoDB
 * 2. Используйте команды из комментариев ниже
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('❌ MONGO_URI не найден в .env файле');
    process.exit(1);
}

// Схема подписки (упрощенная версия)
const subscriptionSchema = new mongoose.Schema({}, { strict: false, collection: 'subscriptions' });
const Subscription = mongoose.model('Subscription', subscriptionSchema);

const userSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const User = mongoose.model('User', userSchema);

async function addProSubscription(userEmail, remove = false) {
    try {
        console.log('🔌 Подключение к MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Подключено к MongoDB');

        // Найти пользователя по email
        console.log(`\n🔍 Поиск пользователя с email: ${userEmail}`);
        const user = await User.findOne({ email: userEmail });
        
        if (!user) {
            console.error(`❌ Пользователь с email ${userEmail} не найден`);
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log(`✅ Пользователь найден: ${user._id}`);

        // Если нужно удалить подписку
        if (remove) {
            const deleted = await Subscription.deleteMany({ userId: user._id });
            if (deleted.deletedCount > 0) {
                console.log(`\n🗑️  Удалено подписок: ${deleted.deletedCount}`);
                console.log(`✅ Подписка удалена для пользователя ${userEmail}`);
            } else {
                console.log(`\n⚠️  Подписка не найдена для удаления`);
            }
            await mongoose.disconnect();
            return;
        }

        // Проверить, есть ли уже подписка
        const existingSubscription = await Subscription.findOne({ userId: user._id });
        
        if (existingSubscription) {
            console.log(`\n⚠️  У пользователя уже есть подписка:`);
            console.log(`   Тип: ${existingSubscription.type}`);
            console.log(`   Статус: ${existingSubscription.status}`);
            console.log(`   ID: ${existingSubscription._id}`);
            
            // Обновить существующую подписку на PRO
            console.log(`\n🔄 Обновление подписки на PRO...`);
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            
            await Subscription.updateOne(
                { userId: user._id },
                {
                    $set: {
                        type: 'PRO',
                        status: 'ACTIVE',
                        price: 0, // Бесплатная для теста
                        startDate: new Date(),
                        endDate: oneYearFromNow,
                        updatedAt: new Date(),
                        // Оставляем существующие stripe поля, если они есть
                        stripeSubscriptionId: existingSubscription.stripeSubscriptionId || `manual_${Date.now()}`,
                        customerId: existingSubscription.customerId || `manual_customer_${Date.now()}`,
                    }
                }
            );
            
            console.log('✅ Подписка обновлена на PRO');
        } else {
            // Создать новую подписку PRO
            console.log(`\n➕ Создание новой PRO подписки...`);
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            
            const newSubscription = new Subscription({
                userId: user._id,
                type: 'PRO',
                status: 'ACTIVE',
                price: 0, // Бесплатная для теста
                startDate: new Date(),
                endDate: oneYearFromNow,
                stripeSubscriptionId: `manual_${Date.now()}`,
                customerId: `manual_customer_${Date.now()}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            
            await newSubscription.save();
            console.log('✅ PRO подписка создана');
        }

        // Показать итоговую подписку
        const finalSubscription = await Subscription.findOne({ userId: user._id });
        if (finalSubscription) {
            console.log(`\n📋 Итоговая подписка:`);
            console.log(`   ID: ${finalSubscription._id}`);
            console.log(`   Тип: ${finalSubscription.type}`);
            console.log(`   Статус: ${finalSubscription.status}`);
            console.log(`   Начало: ${finalSubscription.startDate}`);
            console.log(`   Конец: ${finalSubscription.endDate}`);
            console.log(`   Цена: $${finalSubscription.price}`);
            console.log(`\n✅ Готово! Пользователь ${userEmail} теперь имеет PRO подписку`);
        }
        
        await mongoose.disconnect();
        console.log('🔌 Отключено от MongoDB');
    } catch (error) {
        console.error('❌ Ошибка:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Получить аргументы из командной строки
const args = process.argv.slice(2);
const userEmail = args.find(arg => !arg.startsWith('--'));
const remove = args.includes('--remove') || args.includes('-r');

if (!userEmail) {
    console.error('❌ Укажите email пользователя');
    console.log('\nИспользование:');
    console.log('  node add-pro-subscription.js <userEmail> [--remove]');
    console.log('\nПримеры:');
    console.log('  node add-pro-subscription.js user@example.com');
    console.log('  node add-pro-subscription.js user@example.com --remove');
    process.exit(1);
}

addProSubscription(userEmail, remove);

