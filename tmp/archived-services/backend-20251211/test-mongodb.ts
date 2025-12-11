// Test MongoDB connection
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in environment variables");
  process.exit(1);
}

console.log("🔌 Testing MongoDB connection...");
console.log("📍 URI:", MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")); // Hide credentials

mongoose.set("strictQuery", true);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB connection successful!");
    console.log("📊 Database:", mongoose.connection.db?.databaseName);
    console.log("🔗 Host:", mongoose.connection.host);
    console.log("📝 Port:", mongoose.connection.port);
    
    // Test a simple query
    return mongoose.connection.db?.admin().ping();
  })
  .then((result) => {
    if (result) {
      console.log("✅ Ping successful:", result);
    }
    console.log("\n✅ All tests passed!");
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed!");
    console.error("Error:", error.message);
    if (error instanceof Error && error.stack) {
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  });

