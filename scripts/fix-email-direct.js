/**
 * Скрипт для прямого исправления email в базе данных
 */

const path = require('path');
const backendNodeModules = path.join(__dirname, '../TRYGO-Backend/node_modules');
require('module')._initPaths([backendNodeModules]);
const dotenvPath = require.resolve('dotenv', { paths: [backendNodeModules] });
require(dotenvPath).config({ path: path.join(__dirname, '../TRYGO-Backend/.env') });
const mongoosePath = require.resolve('mongoose', { paths: [backendNodeModules] });
const mongoose = require(mongoosePath);

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function fixEmail() {
  try {
    console.log('🔗 Подключение к базе данных...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Подключено\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    const userId = '686773b5773b5947fed60a68';
    const oldEmail = 'sigayyury5@gmail.com';
    const newEmail = 'sigayyury@gmail.com';

    // Проверяем текущее состояние
    console.log('🔍 Проверка текущего состояния...');
    const currentUser = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!currentUser) {
      console.error('❌ Пользователь не найден');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`   Текущий email: ${currentUser.email}`);
    console.log(`   ID: ${currentUser._id}\n`);

    if (currentUser.email === newEmail) {
      console.log('✅ Email уже изменен!');
      await mongoose.disconnect();
      return;
    }

    // Проверяем, не занят ли новый email
    const existingUser = await usersCollection.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== userId) {
      console.log('⚠️  Найден пользователь с новым email, удаляем его...');
      await usersCollection.deleteOne({ _id: existingUser._id });
      console.log('✅ Старый аккаунт удален\n');
    }

    // Меняем email напрямую через MongoDB
    console.log(`🔄 Изменение email: ${oldEmail} → ${newEmail}...`);
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { email: newEmail } }
    );

    if (result.modifiedCount === 1) {
      console.log('✅ Email успешно изменен!\n');
    } else {
      console.log('⚠️  Изменений не было (возможно, email уже изменен)\n');
    }

    // Проверяем результат
    const updatedUser = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    console.log('🔍 Проверка результата:');
    console.log(`   ID: ${updatedUser._id}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   PasswordHash: ${updatedUser.passwordHash ? 'Есть ✅' : 'ОТСУТСТВУЕТ ❌'}\n`);

    if (updatedUser.email === newEmail) {
      console.log('✅ Миграция завершена успешно!');
      console.log(`   Теперь можно войти с email: ${newEmail}`);
    } else {
      console.error('❌ ОШИБКА: Email не изменился!');
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

fixEmail().catch(console.error);

