import mongoose from "mongoose";

import { env } from "../config/env.js";

export const connectMongo = async (): Promise<typeof mongoose> => {
  try {
    mongoose.set("strictQuery", true);
    
    // Log connection attempt (without exposing credentials)
    const mongoUriDisplay = env.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
    console.log(`🔌 Connecting to MongoDB: ${mongoUriDisplay}`);
    
    const connection = await mongoose.connect(env.mongoUri);
    
    console.log(`✅ MongoDB connected successfully`);
    console.log(`   Database: ${connection.connection.db?.databaseName || "unknown"}`);
    
    // Handle connection events
    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error.message);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected");
    });
    
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
    
    return connection;
  } catch (error: any) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error(`   Error: ${error.message}`);
    console.error(`   URI: ${env.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")}`);
    
    if (error.message.includes("ECONNREFUSED")) {
      console.error("   💡 Tip: Make sure MongoDB is running and the connection string is correct");
    } else if (error.message.includes("authentication failed")) {
      console.error("   💡 Tip: Check your MongoDB username and password");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      console.error("   💡 Tip: Check your MongoDB hostname/URL");
    }
    
    throw error;
  }
};

