import { REDIS_PASSWORD, REDIS_URL } from "../constants/env";
import { createClient } from "redis";

// Create Redis client
const redisClient = createClient({
  url: REDIS_URL,
  password: REDIS_PASSWORD,
});

// Error handling
redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis Client Connected");
});

// Connect to Redis
const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

export { connectRedis, redisClient };
