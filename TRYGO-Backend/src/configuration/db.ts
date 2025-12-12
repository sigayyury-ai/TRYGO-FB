import mongoose from 'mongoose';

const connectMainDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('Using Existing Connection ✅');
            return;
        }

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Log connection attempt (without exposing credentials)
        const mongoUriDisplay = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
        console.log(`🔌 Connecting to MongoDB: ${mongoUriDisplay}`);

        await mongoose.connect(mongoUri);
        
        const timestamp = new Date().toISOString();
        const dbName = mongoose.connection.db?.databaseName || 'unknown';
        console.log(`[${timestamp}] ✅ [MONGODB] Connected successfully`);
        console.log(`[${timestamp}] 📊 [MONGODB] Database: ${dbName}`);

        // Handle connection events
        mongoose.connection.on('error', (error) => {
            const timestamp = new Date().toISOString();
            console.error(`[${timestamp}] ❌ [MONGODB] Connection error: ${error.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            const timestamp = new Date().toISOString();
            console.warn(`[${timestamp}] ⚠️  [MONGODB] Disconnected`);
        });

        mongoose.connection.on('reconnected', () => {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ✅ [MONGODB] Reconnected`);
        });
    } catch (error: any) {
        console.error('❌ Failed to connect to MongoDB:');
        console.error(`   Error: ${error.message}`);
        
        if (!process.env.MONGODB_URI) {
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
