import { AppErrorCode, NODE_ENV } from "../constants";
import type { HttpStatusCode } from "../constants/http";

/**
 * Custom Application Error class for consistent error handling
 */
class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: AppErrorCode;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    statusCode: HttpStatusCode,
    message: string,
    code: AppErrorCode,
    isOperational = true,
    details?: Record<string, unknown>
  ) {
    super(message);

    // Restore prototype chain
    Object.setPrototypeOf(this, AppError.prototype);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    if (details !== undefined) {
      this.details = details;
    }

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    // Set the error name
    this.name = this.constructor.name;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      details: this.details,
      stack: NODE_ENV === "development" ? this.stack : undefined,
    };
  }
}

export default AppError;
