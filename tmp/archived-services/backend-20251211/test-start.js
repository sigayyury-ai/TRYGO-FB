// Quick test to see where backend fails
console.log("1. Starting test...");

try {
  console.log("2. Loading dotenv...");
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config({ path: ".env" });
  console.log("3. ✅ Dotenv loaded");
  
  console.log("4. Checking MONGODB_URI...");
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not set");
  }
  console.log("5. ✅ MONGODB_URI is set");
  
  console.log("6. Testing MongoDB connection...");
  const mongoose = require("mongoose");
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      console.log("7. ✅ MongoDB connected!");
      process.exit(0);
    })
    .catch((err) => {
      console.error("7. ❌ MongoDB connection failed:", err.message);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}





