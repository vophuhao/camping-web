/**
 * Report Service
 * Content reporting and admin moderation
 */
import apiClient from '@/lib/api-client';

export interface CreateReportInput {
  targetId: string;
  targetType: 'post' | 'free-spot';
  reason: string;
  description?: string;
}

export interface GetReportsParams {
  page?: number;
  limit?: number;
  status?: string;
  targetType?: string;
}

export const createReport = (data: CreateReportInput): Promise<unknown> =>
  apiClient.post('/reports', data);

export const getReports = (params: GetReportsParams = {}): Promise<unknown> =>
  apiClient.get('/reports', { params });

export const updateReport = (
  id: string,
  data: { status: string; resolveNote?: string; action?: 'hide_target' | 'none' },
): Promise<unknown> => apiClient.patch(`/reports/${id}`, data);

export const getAdminForumPosts = (
  params: { page?: number; limit?: number; status?: string; search?: string } = {},
): Promise<unknown> => apiClient.get('/reports/admin/forum-posts', { params });

export const updateForumPostStatus = (
  id: string,
  data: { status: string; moderationReason?: string },
): Promise<unknown> => apiClient.patch(`/reports/admin/forum-posts/${id}`, data);

export const getAdminFreeSpots = (
  params: { page?: number; limit?: number; status?: string; search?: string } = {},
): Promise<unknown> => apiClient.get('/reports/admin/free-spots', { params });

export const updateFreeSpotStatus = (
  id: string,
  data: { status: string; isVerified?: boolean },
): Promise<unknown> => apiClient.patch(`/reports/admin/free-spots/${id}`, data);
