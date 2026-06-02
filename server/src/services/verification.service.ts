import { redisClient } from "../config/redis";
import crypto from "crypto";

export default class VerificationService {
  // Prefix for keys in Redis
  private readonly EMAIL_VERIFICATION_PREFIX = "email_verify:";
  private readonly PASSWORD_RESET_PREFIX = "password_reset:";
  private readonly RATE_LIMIT_PREFIX = "rate_limit:";

  // TTL (Time To Live)
  private readonly EMAIL_VERIFICATION_TTL = 24 * 60 * 60; // 24 hours
  private readonly PASSWORD_RESET_TTL = 15 * 60; // 15 minutes
  private readonly RATE_LIMIT_TTL = 60; // 1 minute

  // Max requests per minute
  private readonly MAX_REQUESTS_PER_MINUTE = 3;

  private generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async checkRateLimit(email: string): Promise<boolean> {
    const key = `${this.RATE_LIMIT_PREFIX}${email}`;
    const count = await redisClient.get(key);

    if (count && parseInt(count) >= this.MAX_REQUESTS_PER_MINUTE) {
      return false; // Exceeded rate limit
    }

    return true;
  }

  private async incrementRateLimit(email: string): Promise<void> {
    const key = `${this.RATE_LIMIT_PREFIX}${email}`;
    const current = await redisClient.get(key);

    if (current) {
      await redisClient.incr(key);
    } else {
      await redisClient.set(key, "1", { EX: this.RATE_LIMIT_TTL });
    }
  }

  async createEmailVerification(email: string): Promise<string> {
    const code = this.generateCode();
    const key = `${this.EMAIL_VERIFICATION_PREFIX}${email}`;

    // Store code in Redis with TTL
    await redisClient.set(key, code, {
      EX: this.EMAIL_VERIFICATION_TTL,
    });

    // Increase rate limit counter
    await this.incrementRateLimit(email);

    return code;
  }

  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    const key = `${this.EMAIL_VERIFICATION_PREFIX}${email}`;
    const storedCode = await redisClient.get(key);

    if (!storedCode || storedCode !== code) {
      return false;
    }

    // Delete code after successful verification
    await redisClient.del(key);
    return true;
  }

  async createPasswordReset(email: string): Promise<string> {
    const code = this.generateCode();
    const key = `${this.PASSWORD_RESET_PREFIX}${email}`;

    // Store code in Redis with TTL
    await redisClient.set(key, code, {
      EX: this.PASSWORD_RESET_TTL,
    });

    // Increase rate limit counter
    await this.incrementRateLimit(email);

    return code;
  }

  async verifyPasswordResetCode(email: string, code: string): Promise<boolean> {
    const key = `${this.PASSWORD_RESET_PREFIX}${email}`;
    const storedCode = await redisClient.get(key);

    if (!storedCode || storedCode !== code) {
      return false;
    }

    // Delete code after successful verification
    await redisClient.del(key);
    return true;
  }

  async deleteEmailVerification(email: string): Promise<void> {
    const key = `${this.EMAIL_VERIFICATION_PREFIX}${email}`;
    await redisClient.del(key);
  }

  async deletePasswordReset(email: string): Promise<void> {
    const key = `${this.PASSWORD_RESET_PREFIX}${email}`;
    await redisClient.del(key);
  }

  async getEmailVerificationTTL(email: string): Promise<number> {
    const key = `${this.EMAIL_VERIFICATION_PREFIX}${email}`;
    return await redisClient.ttl(key);
  }

  async getPasswordResetTTL(email: string): Promise<number> {
    const key = `${this.PASSWORD_RESET_PREFIX}${email}`;
    return await redisClient.ttl(key);
  }
}
