import mongoose from 'mongoose';

const connectMainDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('Using Existing Connection ✅');
            return;
        }

        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Log connection attempt (without exposing credentials)
        const mongoUriDisplay = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        console.log(`🔌 Connecting to MongoDB: ${mongoUriDisplay}`);

        await mongoose.connect(mongoUri);
        
        console.log('✅ Mongoose Connected');
        console.log(`   Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error.message);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });
    } catch (error: any) {
        console.error('❌ Failed to connect to MongoDB:');
        console.error(`   Error: ${error.message}`);
        
        if (!process.env.MONGODB_URI && !process.env.MONGO_URI) {
            console.error('   💡 Tip: Set MONGODB_URI environment variable');
        } else if (error.message.includes('ECONNREFUSED')) {
            console.error('   💡 Tip: Make sure MongoDB is running and the connection string is correct');
        } else if (error.message.includes('authentication failed')) {
            console.error('   💡 Tip: Check your MongoDB username and password');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('   💡 Tip: Check your MongoDB hostname/URL');
        }
        
        throw new Error(`Connect to Mongoose failed: ${error.message}`);
    }
};

export { connectMainDB };
