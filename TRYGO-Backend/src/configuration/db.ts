import mongoose from 'mongoose';

const connectMainDB = async () => {
    try {
        if (mongoose.connection.readyState === 1)
            return console.log('Using Existing Connection ✅');

        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Mongoose Connected 💚');
    } catch {
        throw new Error('Connect to Mongoose failed ❌');
    }
};

export { connectMainDB };
