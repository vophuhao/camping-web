import { AppErrorCode, CREATED, NO_CONTENT, OK } from "../constants";
import type { ApiResponse, ErrorResponse, PaginatedResponse } from "../types";
import type { Response } from "express";

/**
 * Utility class for creating consistent API responses
 */
class ResponseUtil {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data?: T,
    message = "Success",
    statusCode = OK
  ): Response<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message = "Error occurred",
    statusCode: number,
    code?: AppErrorCode,
    errors?: string[],
    details?: Record<string, unknown>,
    stack?: string
  ): Response<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      message,
      code,
      errors,
      details,
      stack,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    },
    message = "Success",
    statusCode = OK
  ): Response<PaginatedResponse<T>> {
    const response: PaginatedResponse<T> = {
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString(),
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  static created<T>(
    res: Response,
    data?: T,
    message = "Resource created successfully"
  ): Response<ApiResponse<T>> {
    return this.success(res, data, message, CREATED);
  }

  /**
   * Send no content response
   */
  static noContent(res: Response): Response {
    return res.status(NO_CONTENT).send();
  }
  static outOfStock(res: Response, statusCode: number, message: string, code?: string) {
    return res.status(statusCode).json({
      success: false,
      code,
      message
    });
  }
}

export default ResponseUtil;
