/**
 * Free Spot Service
 * Community-shared free camping spots
 */
import apiClient from '@/lib/api-client';

export interface FreeSpot {
  _id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  province?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  images: string[];
  directions?: string;
  author: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
  terrain: 'mountain' | 'beach' | 'forest' | 'river' | 'lake' | 'field' | 'other';
  amenities: string[];
  likes: string[];
  likeCount: number;
  viewCount: number;
  commentCount: number;
  slug: string;
  isVerified: boolean;
  status: 'active' | 'pending' | 'hidden';
  createdAt: string;
  updatedAt?: string;
}

export interface FreeSpotComment {
  _id: string;
  user: {
    _id: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  createdAt: string;
}

export interface GetSpotsParams {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  terrain?: string;
}

export const getFreeSpots = (params: GetSpotsParams = {}): Promise<unknown> =>
  apiClient.get('/free-spots', { params });

export const getNearbySpots = (
  lat: number,
  lng: number,
  radius = 50,
): Promise<unknown> =>
  apiClient.get('/free-spots/nearby', { params: { lat, lng, radius } });

export const getFreeSpotById = (id: string): Promise<unknown> =>
  apiClient.get(`/free-spots/${id}`);

export const createFreeSpot = (formData: FormData): Promise<unknown> =>
  apiClient.post('/free-spots', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const toggleLike = (id: string): Promise<unknown> =>
  apiClient.post(`/free-spots/${id}/like`);

export const deleteFreeSpot = (id: string): Promise<unknown> =>
  apiClient.delete(`/free-spots/${id}`);

export const getSpotComments = (spotId: string): Promise<unknown> =>
  apiClient.get(`/free-spots/${spotId}/comments`);

export const addSpotComment = (spotId: string, content: string): Promise<unknown> =>
  apiClient.post(`/free-spots/${spotId}/comments`, { content });

export const updateFreeSpot = (id: string, formData: FormData): Promise<unknown> =>
  apiClient.put(`/free-spots/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
