/**
 * Скрипт для проверки email пользователя
 */

const path = require('path');
const backendNodeModules = path.join(__dirname, '../TRYGO-Backend/node_modules');
require('module')._initPaths([backendNodeModules]);
const dotenvPath = require.resolve('dotenv', { paths: [backendNodeModules] });
require(dotenvPath).config({ path: path.join(__dirname, '../TRYGO-Backend/.env') });
const mongoosePath = require.resolve('mongoose', { paths: [backendNodeModules] });
const mongoose = require(mongoosePath);

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function checkUser() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  
  const userId = '686773b5773b5947fed60a68';
  const user = await User.findById(userId).exec();
  
  if (user) {
    console.log('✅ Пользователь найден:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
  } else {
    console.log('❌ Пользователь не найден');
  }
  
  const userByEmail = await User.findOne({ email: 'sigayyury@gmail.com' }).exec();
  if (userByEmail) {
    console.log('\n✅ Пользователь найден по email sigayyury@gmail.com:');
    console.log(`   ID: ${userByEmail._id}`);
    console.log(`   Email: ${userByEmail.email}`);
  }
  
  await mongoose.disconnect();
}

checkUser().catch(console.error);

