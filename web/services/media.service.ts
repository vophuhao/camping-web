/**
 * Media Service
 * File upload and media analysis
 */
import apiClient from '@/lib/api-client';

export async function uploadMedia(formData: FormData): Promise<ApiResponse> {
  return apiClient.post('/media/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function analyzeMedia(formData: FormData): Promise<ApiResponse> {
  return apiClient.post('/media/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
