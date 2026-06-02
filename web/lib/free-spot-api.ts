/* eslint-disable @typescript-eslint/no-explicit-any */
import API from './api-client';

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

// ── List + filter ────────────────────────────────────────────────
export const getFreeSpots = (params: GetSpotsParams = {}): Promise<any> =>
  API.get('/free-spots', { params });

// ── Nearby ───────────────────────────────────────────────────────
export const getNearbySpots = (
  lat: number,
  lng: number,
  radius = 50,
): Promise<any> =>
  API.get('/free-spots/nearby', { params: { lat, lng, radius } });

// ── Detail ───────────────────────────────────────────────────────
export const getFreeSpotById = (id: string): Promise<any> =>
  API.get(`/free-spots/${id}`);

// ── Create ───────────────────────────────────────────────────────
export const createFreeSpot = (formData: FormData): Promise<any> =>
  API.post('/free-spots', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ── Like ─────────────────────────────────────────────────────────
export const toggleLike = (id: string): Promise<any> =>
  API.post(`/free-spots/${id}/like`);

// ── Delete ───────────────────────────────────────────────────────
export const deleteFreeSpot = (id: string): Promise<any> =>
  API.delete(`/free-spots/${id}`);

// ── Comments ─────────────────────────────────────────────────────
export const getComments = (spotId: string): Promise<any> =>
  API.get(`/free-spots/${spotId}/comments`);

export const addComment = (spotId: string, content: string): Promise<any> =>
  API.post(`/free-spots/${spotId}/comments`, { content });

// ── Update ───────────────────────────────────────────────────────
export const updateFreeSpot = (id: string, formData: FormData): Promise<any> =>
  API.put(`/free-spots/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

