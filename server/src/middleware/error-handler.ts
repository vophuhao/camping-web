import { AppErrorCode, INTERNAL_SERVER_ERROR, NODE_ENV, UNPROCESSABLE_CONTENT } from "../constants";
import { AppError } from "../errors";
import { clearAuthCookies, REFRESH_PATH, ResponseUtil } from "../utils";
import type { ErrorRequestHandler, Response } from "express";
import { z } from "zod";

/**
 * Handle Zod validation errors
 */
const handleZodError = (res: Response, error: z.ZodError) => {
  const errors = error.issues.map((err) => `${err.path.join(".")}: ${err.message}`);

  const formattedErrors = errors.map((e) => e.replace(/^.*?:\s*/, ""));
  return ResponseUtil.error(
    res,
    formattedErrors.join(", "),
    UNPROCESSABLE_CONTENT,
    AppErrorCode.VALIDATION_ERROR,
    errors
  );
};

/**
 * Handle custom AppError instances
 */
const handleAppError = (res: Response, error: AppError) => {
  return ResponseUtil.error(
    res,
    error.message,
    error.statusCode,
    error.code,
    undefined,
    error.details
    //NODE_ENV === "development" ? error.stack : undefined
  );
};

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  // Log errors in development for debugging
  if (NODE_ENV === "development") {
    console.error(`❌ Error on ${req.method} ${req.path}:`, error);
  }

  // Log operational errors in production for monitoring
  if (NODE_ENV === "production" && error instanceof AppError && !error.isOperational) {
    console.error("Non-operational error:", error);
  }

  // Clear auth cookies on refresh token request errors
  if (req.path === REFRESH_PATH) {
    clearAuthCookies(res);
  }

  // Handle specific error types
  if (error instanceof z.ZodError) {
    return handleZodError(res, error);
  }

  if (error instanceof AppError) {
    return handleAppError(res, error);
  }

  // Handle unexpected errors
  return ResponseUtil.error(res, "Internal server error", INTERNAL_SERVER_ERROR);
};

export default errorHandler;
