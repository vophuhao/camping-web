import { NODE_ENV } from "../constants";
import type { CookieOptions, Response } from "express";
import { oneWeekFromNow, thirtyDaysFromNow } from "./date";

export const REFRESH_PATH = "/auth/refresh";

const defaults: CookieOptions = {
  sameSite: NODE_ENV === "production" ? "none" : "lax",
  httpOnly: true,
  secure: NODE_ENV === "production" ? true : false,
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