const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    const mongoUri = env.MONGO_URI || process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
