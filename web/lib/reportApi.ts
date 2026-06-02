/* eslint-disable @typescript-eslint/no-explicit-any */
import API from './api-client';

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

// ── User: submit a report ─────────────────────────────────────────
export const createReport = (data: CreateReportInput): Promise<any> =>
  API.post('/reports', data);

// ── Admin: list all reports ───────────────────────────────────────
export const getReports = (params: GetReportsParams = {}): Promise<any> =>
  API.get('/reports', { params });

// ── Admin: update report status ───────────────────────────────────
export const updateReport = (
  id: string,
  data: { status: string; resolveNote?: string; action?: 'hide_target' | 'none' }
): Promise<any> => API.patch(`/reports/${id}`, data);

// ── Admin: manage forum posts ─────────────────────────────────────
export const getAdminForumPosts = (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<any> => API.get('/reports/admin/forum-posts', { params });

export const updateForumPostStatus = (
  id: string,
  data: { status: string; moderationReason?: string }
): Promise<any> => API.patch(`/reports/admin/forum-posts/${id}`, data);

// ── Admin: manage free-spots ──────────────────────────────────────
export const getAdminFreeSpots = (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
} = {}): Promise<any> => API.get('/reports/admin/free-spots', { params });

export const updateFreeSpotStatus = (
  id: string,
  data: { status: string; isVerified?: boolean }
): Promise<any> => API.patch(`/reports/admin/free-spots/${id}`, data);
