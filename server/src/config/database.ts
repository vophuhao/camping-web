import { MONGO_URI, NODE_ENV } from "../constants/env";
import mongoose from "mongoose";

const connectToDatabase = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGO_URI, {
      // Connection pool - tăng để handle nhiều concurrent requests
      maxPoolSize: 50,        // Tối đa 50 connections (default: 5)
      minPoolSize: 5,         // Luôn giữ 5 connections sẵn sàng
      // Timeouts
      serverSelectionTimeoutMS: 5000,  // Timeout khi chọn server
      socketTimeoutMS: 45000,          // Timeout socket không active
      connectTimeoutMS: 10000,         // Timeout khi kết nối lần đầu
      // Heartbeat
      heartbeatFrequencyMS: 10000,     // Kiểm tra health mỗi 10s
    });
    console.log(`✅ Successfully connected to DB! Pool size: 50`);
  } catch (error) {
    console.error("❌ Could not connect to DB", error);
    process.exit(1);
  }
};

// Monitor connection events trong development
if (NODE_ENV === "development") {
  mongoose.connection.on("connected", () => console.log("🔗 Mongoose connected"));
  mongoose.connection.on("disconnected", () => console.warn("⚠️ Mongoose disconnected"));
  mongoose.connection.on("error", (err) => console.error("❌ Mongoose error:", err));
}

// Graceful shutdown - đóng connection khi process kết thúc
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed on app termination");
  process.exit(0);
});

export default connectToDatabase;
