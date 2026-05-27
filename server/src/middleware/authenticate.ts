import { redisClient } from "@/config/redis";
import { ErrorFactory } from "@/errors";
import { UserModel } from "@/models";
import { appAssert } from "@/utils";
import { verifyToken } from "@/utils/jwt";
import type { RequestHandler } from "express";
import type mongoose from "mongoose";

// Cache TTL: 60 giây — đủ ngắn để block có hiệu lực nhanh
const USER_BLOCK_CACHE_TTL = 60;
const CACHE_PREFIX = "user:blocked:";

async function isUserBlocked(userId: string): Promise<boolean> {
  const cacheKey = `${CACHE_PREFIX}${userId}`;

  // 1. Thử lấy từ Redis cache trước
  if (redisClient.isOpen) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached !== null) {
        return cached === "1"; // "1" = blocked, "0" = not blocked
      }
    } catch {
      // Redis lỗi → fallback sang DB
    }
  }

  // 2. Query DB nếu cache miss
  const user = await UserModel.findById(userId).select("isBlocked").lean();
  if (!user) return true; // Coi như blocked nếu không tìm thấy

  const blocked = user.isBlocked === true;

  // 3. Lưu vào Redis cache
  if (redisClient.isOpen) {
    redisClient
      .setEx(cacheKey, USER_BLOCK_CACHE_TTL, blocked ? "1" : "0")
      .catch(() => {}); // Fire-and-forget, không chặn response
  }

  return blocked;
}

// Helper: Xóa cache khi admin block/unblock user (gọi từ admin service)
export async function invalidateUserBlockCache(userId: string): Promise<void> {
  if (redisClient.isOpen) {
    await redisClient.del(`${CACHE_PREFIX}${userId}`).catch(() => {});
  }
}

// wrap with catchErrors() if you need this to be async
const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const accessToken = req.cookies.accessToken as string | undefined;
    appAssert(accessToken, ErrorFactory.invalidToken("Missing access token"));

    const { error, payload } = verifyToken(accessToken);
    appAssert(
      payload,
      error === "jwt expired" ? ErrorFactory.expiredToken() : ErrorFactory.invalidToken()
    );

    // Check if user account is blocked (với Redis cache)
    const blocked = await isUserBlocked(payload.userId.toString());
    appAssert(!blocked, ErrorFactory.forbidden("Tài khoản của bạn đã bị khóa"));

    req.userId = payload.userId as mongoose.Types.ObjectId;
    req.sessionId = payload.sessionId as mongoose.Types.ObjectId;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;

