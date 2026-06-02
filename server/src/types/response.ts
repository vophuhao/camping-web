import { AppErrorCode } from "../constants";

// response.json() types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T | undefined;
  timestamp: string;
}

export interface ErrorResponse extends ApiResponse<never> {
  code?: AppErrorCode | undefined;
  errors?: string[] | undefined;
  details?: Record<string, unknown> | undefined;
  stack?: string | undefined;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export type PaginationType = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};
