import rateLimit from "express-rate-limit";
import { NODE_ENV } from "@/constants/env";

// ==============================
// Helper — tắt rate limit ở test
// ==============================
const isTestEnv = NODE_ENV === "test";

// ==============================
// Global rate limiter
// 200 requests / minute / IP
// ==============================
export const globalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: isTestEnv ? 10000 : 200,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút.",
    code: "RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,  // Trả về headers `RateLimit-*`
  legacyHeaders: false,
  skip: (req) => req.ip === "::1" || req.ip === "127.0.0.1", // Skip localhost nếu cần
});

// ==============================
// Auth rate limiter (stricter)
// 15 requests / 15 minutes / IP — chống brute force
// ==============================
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isTestEnv ? 10000 : 15,
  message: {
    success: false,
    message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==============================
// Upload rate limiter
// 10 uploads / minute / IP
// ==============================
export const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: isTestEnv ? 10000 : 10,
  message: {
    success: false,
    message: "Quá nhiều yêu cầu upload, vui lòng thử lại sau.",
    code: "UPLOAD_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==============================
// Webhook rate limiter
// 100 / minute — cho PayOS webhook
// ==============================
export const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: isTestEnv ? 10000 : 100,
  message: {
    success: false,
    message: "Too many webhook requests.",
    code: "WEBHOOK_RATE_LIMIT_EXCEEDED",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
