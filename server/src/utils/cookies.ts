import { NODE_ENV } from "@/constants";
import type { CookieOptions, Response } from "express";
import { oneWeekFromNow, thirtyDaysFromNow } from "./date";

export const REFRESH_PATH = "/auth/refresh";

// ✨ ĐÃ SỬA: Cấu hình lại cookie để hỗ trợ chạy Cross-Domain (Vercel <-> Render)
const defaults: CookieOptions = {
  sameSite: NODE_ENV === "production" ? "none" : "lax", // Production phải là "none", local dùng "lax" hoặc giữ "strict"
  httpOnly: true,
  secure: NODE_ENV === "production" ? true : false,     // "none" bắt buộc phải đi kèm với secure: true trên HTTPS
};

export const getAccessTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: thirtyDaysFromNow(),
});

export const getRefreshTokenCookieOptions = (): CookieOptions => ({
  ...defaults,
  expires: oneWeekFromNow(),
  path: REFRESH_PATH,
});

type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const setAuthCookies = ({ res, accessToken, refreshToken }: Params) =>
  res
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .cookie("refreshToken", refreshToken, getRefreshTokenCookieOptions());

// ✨ ĐÃ SỬA: Khi xóa cookie cũng phải truyền kèm đúng cấu hình `path` và `sameSite/secure` thì trình duyệt mới chịu xóa
export const clearAuthCookies = (res: Response) =>
  res
    .clearCookie("accessToken", {
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      secure: NODE_ENV === "production"
    })
    .clearCookie("refreshToken", {
      path: REFRESH_PATH,
      sameSite: NODE_ENV === "production" ? "none" : "lax",
      secure: NODE_ENV === "production"
    });