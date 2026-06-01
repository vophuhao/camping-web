/**
 * Property Service
 * Re-exports all property and site API functions from lib/property-site-api.ts
 * with additional consolidation of property-related calls
 */

// Re-export all property/site API functions
export * from '@/lib/property-site-api';

import apiClient from '@/lib/api-client';

// ================== PRODUCTS ==================
export const getProductBySlug = async (slug: string): Promise<ApiResponse> =>
  apiClient.get(`/products/slug/${slug}`);

export const getAllProduct = async (): Promise<ApiResponse> =>
  apiClient.get('/products/all');

export const searchProductsFuzzy = async (
  query: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<unknown>> =>
  apiClient.get('/products/search', { params: { key: query, page, limit } });

// ================== RATINGS ==================
export const getRatingsByProductId = async (
  productId: string,
): Promise<ApiResponse> =>
  apiClient.get(`/rating/product/${productId}`);

export const createRating = async (data: unknown): Promise<ApiResponse> =>
  apiClient.post('/rating', data);
