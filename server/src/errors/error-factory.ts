import {
  AppErrorCode,
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
  UNPROCESSABLE_CONTENT,
} from "../constants";
import AppError from "./app-error";

/**
 * Centralized error creation utility
 * Provides consistent error handling across the application
 */
class ErrorFactory {
  // Authentication Errors
  static invalidCredentials(message = "Invalid email or password") {
    return new AppError(UNAUTHORIZED, message, AppErrorCode.INVALID_CREDENTIALS);
  }

  static invalidToken(message = "Invalid token") {
    return new AppError(UNAUTHORIZED, message, AppErrorCode.INVALID_ACCESS_TOKEN);
  }

  static expiredToken(message = "Token has expired") {
    return new AppError(UNAUTHORIZED, message, AppErrorCode.TOKEN_EXPIRED);
  }

  static emailNotVerified(message = "Please verify your email before proceeding") {
    return new AppError(UNAUTHORIZED, message, AppErrorCode.EMAIL_NOT_VERIFIED);
  }

  // Resource Errors
  static resourceNotFound(resource = "Resource", message?: string) {
    const errorMessage = message || `${resource} not found`;
    return new AppError(NOT_FOUND, errorMessage, AppErrorCode.RESOURCE_NOT_FOUND);
  }

  static resourceExists(resource = "Resource", message?: string) {
    const errorMessage = message || `${resource} already exists`;
    return new AppError(CONFLICT, errorMessage, AppErrorCode.RESOURCE_ALREADY_EXISTS);
  }

  static conflict(message: string) {
    return new AppError(CONFLICT, message, AppErrorCode.RESOURCE_ALREADY_EXISTS);
  }

  static badRequest(message: string) {
    return new AppError(BAD_REQUEST, message, AppErrorCode.VALIDATION_ERROR);
  }

  static forbidden(message: string) {
    return new AppError(FORBIDDEN, message, AppErrorCode.FORBIDDEN_ACTION);
  }

  // Validation Errors
  static validationFailed(message = "Validation failed", details?: Record<string, unknown>) {
    return new AppError(
      UNPROCESSABLE_CONTENT,
      message,
      AppErrorCode.VALIDATION_ERROR,
      true,
      details
    );
  }

  static requiredField(field: string) {
    return new AppError(BAD_REQUEST, `${field} is required`, AppErrorCode.REQUIRED_FIELD_MISSING);
  }

  static invalidFormat(field: string, expectedFormat?: string) {
    const message = expectedFormat
      ? `${field} must be in ${expectedFormat} format`
      : `Invalid format for ${field}`;
    return new AppError(BAD_REQUEST, message, AppErrorCode.INVALID_FORMAT);
  }

  static invalidVerificationCode(message = "Invalid or expired verification code") {
    return new AppError(BAD_REQUEST, message, AppErrorCode.INVALID_VERIFICATION_CODE);
  }

  // Permission Errors
  static insufficientPermissions(message = "Insufficient permissions to perform this action") {
    return new AppError(FORBIDDEN, message, AppErrorCode.INSUFFICIENT_PERMISSIONS);
  }

  static forbiddenAction(action = "action", message?: string) {
    const errorMessage = message || `Cannot perform ${action}`;
    return new AppError(FORBIDDEN, errorMessage, AppErrorCode.FORBIDDEN_ACTION);
  }

  // Rate Limiting
  static tooManyRequests(message = "Too many requests, please try again later") {
    return new AppError(TOO_MANY_REQUESTS, message, AppErrorCode.TOO_MANY_REQUESTS);
  }

  // Server Errors
  static internalError(message = "An internal error occurred", details?: Record<string, unknown>) {
    return new AppError(
      INTERNAL_SERVER_ERROR,
      message,
      AppErrorCode.INTERNAL_SERVER_ERROR,
      true,
      details
    );
  }

  static databaseError(operation = "operation", details?: Record<string, unknown>) {
    const message = `Database ${operation} failed`;
    return new AppError(INTERNAL_SERVER_ERROR, message, AppErrorCode.DATABASE_ERROR, true, details);
  }

  static externalServiceError(service = "service", details?: Record<string, unknown>) {
    const message = `External ${service} service error`;
    return new AppError(
      INTERNAL_SERVER_ERROR,
      message,
      AppErrorCode.EXTERNAL_SERVICE_ERROR,
      true,
      details
    );
  }
}

export default ErrorFactory;
