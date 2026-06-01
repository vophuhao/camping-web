/**
 * Favorite Service
 * Property and site favorites management
 */
import type { FavoriteItem } from '@/store/favorite.store';
import apiClient from '@/lib/api-client';

export async function addPropertyToFavorites(
  propertyId: string,
  notes?: string,
): Promise<ApiResponse<FavoriteItem>> {
  return apiClient.post('/favorites', { property: propertyId, notes });
}

export async function addSiteToFavorites(
  siteId: string,
  notes?: string,
): Promise<ApiResponse<FavoriteItem>> {
  return apiClient.post('/favorites', { site: siteId, notes });
}

export async function removeFavorite(favoriteId: string): Promise<ApiResponse> {
  return apiClient.delete(`/favorites/${favoriteId}`);
}

export async function removePropertyFromFavorites(propertyId: string): Promise<ApiResponse> {
  return apiClient.delete(`/favorites/property/${propertyId}`);
}

export async function removeSiteFromFavorites(siteId: string): Promise<ApiResponse> {
  return apiClient.delete(`/favorites/site/${siteId}`);
}

export async function getUserFavorites(params?: {
  type?: 'property' | 'site' | 'all';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<FavoriteItem>> {
  return apiClient.get('/favorites', { params });
}

export async function isPropertyFavorited(
  propertyId: string,
): Promise<ApiResponse<{ isFavorited: boolean }>> {
  return apiClient.get(`/favorites/check/property/${propertyId}`);
}

export async function isSiteFavorited(
  siteId: string,
): Promise<ApiResponse<{ isFavorited: boolean }>> {
  return apiClient.get(`/favorites/check/site/${siteId}`);
}

export async function updateFavoriteNotes(
  favoriteId: string,
  notes?: string,
): Promise<ApiResponse<FavoriteItem>> {
  return apiClient.patch(`/favorites/${favoriteId}/notes`, { notes });
}
