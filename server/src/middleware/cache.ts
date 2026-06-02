/**
 * Redis Cache Middleware & Utilities
 * 
 * Cách dùng:
 * - Wrap route handler với cacheMiddleware(ttlSeconds)
 * - Dùng invalidateCache(pattern) để xóa cache khi data thay đổi
 */
import { redisClient } from "../config/redis";
import { NODE_ENV } from "../constants/env";
import type { NextFunction, Request, Response } from "express";

const CACHE_ENABLED = NODE_ENV !== "test";

// ==============================
// Cache Middleware cho GET routes
// ==============================
export function cacheMiddleware(ttlSeconds: number = 30) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!CACHE_ENABLED) return next();
    if (!redisClient.isOpen) return next();

    const cacheKey = buildCacheKey(req);

    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", cacheKey);
        res.json(data);
        return;
      }
    } catch {
      // Redis lỗi → tiếp tục không dùng cache
    }

    // Monkey-patch res.json để lưu response vào cache
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Chỉ cache response 2xx thành công
      if (res.statusCode >= 200 && res.statusCode < 300 && redisClient.isOpen) {
        redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(body)).catch(() => { });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
}

// ==============================
// Xây dựng cache key từ request
// ==============================
function buildCacheKey(req: Request): string {
  // Sắp xếp query params để đảm bảo key nhất quán
  const sortedQuery = Object.keys(req.query)
    .sort()
    .map((k) => `${k}=${req.query[k]}`)
    .join("&");

  return `cache:${req.path}${sortedQuery ? "?" + sortedQuery : ""}`;
}

// ==============================
// Xóa cache theo pattern (Glob)
// ==============================
export async function invalidateCache(pattern: string): Promise<number> {
  if (!CACHE_ENABLED || !redisClient.isOpen) return 0;

  try {
    const keys = await redisClient.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return keys.length;
  } catch {
    return 0;
  }
}

// ==============================
// Xóa cache theo prefix (ví dụ "/properties")
// ==============================
export async function invalidateCacheByPrefix(prefix: string): Promise<number> {
  return invalidateCache(`${prefix}*`);
}

// ==============================
// Cache key constants
// ==============================
export const CACHE_KEYS = {
  PROPERTIES: "/properties",
  PROPERTY: (slug: string) => `/properties/${slug}`,
  SITES: (propertyId: string) => `/properties/${propertyId}/sites`,
  AMENITIES: "/amenities",
  REVIEWS: (propertyId: string) => `/reviews/${propertyId}`,
};
