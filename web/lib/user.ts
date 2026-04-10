import { api } from './config';
import type { User } from '../../types/user';

export interface UserStats {
  totalUsers: number;
  totalDocuments: number;
  totalDownloads: number;
  totalPosts: number;
  activeUsers: number;
  satisfactionRate: number;
}

export interface UserProfileStats {
  documentsCount: number;
  postsCount: number;
  points: number;
  experiencePoints: number;
  totalDownloads: number;
  totalViews: number;
  likesReceived?: number; // Total likes received across all posts
}

export interface UserActivity {
  id: string;
  title: string;
  type: 'document' | 'forum';
  time: string;
  downloads?: number;
  likes?: number;
  comments?: number;
  views?: number;
  size?: string;
  author?: string;
  subject?: string;
  slug?: string;
}

export interface UserActivities {
  uploads: UserActivity[];
  posts: UserActivity[];
  likes: UserActivity[];
  saved: UserActivity[];
}

export const userApi = {
  getUserByUsername: async (username: string): Promise<User> => {
    const response = await api.get<User>(`/user/username/${username}`);
    return response.data;
  },

  updateUser: async (userId: string, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/user/${userId}/update`, userData);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post<{ avatarUrl: string }>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  searchUsers: async (q: string, page?: number, pageSize?: number): Promise<{ users: User[], total: number, page: number, pageSize: number }> => {
    const params = new URLSearchParams();
    params.append('q', q);
    if (page) params.append('page', page.toString());
    if (pageSize) params.append('pageSize', pageSize.toString());
    const response = await api.get<{ users: User[], total: number, page: number, pageSize: number }>(`/user/search?${params.toString()}`);
    return response.data;
  },

  updateProfile: async (formData: FormData): Promise<User> => {
    const response = await api.put<User>('/user/me', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const payload = { oldPassword: data.currentPassword, newPassword: data.newPassword };
    const response = await api.post<{ message: string }>('/users/me/change-password', payload);
    return response.data;
  },

  updateSettings: async (settings: any): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>('/user/settings', settings);
    return response.data;
  },

  getStats: async (): Promise<UserStats> => {
    const response = await api.get<UserStats>('/user/stats');
    return response.data;
  },

  getUserStats: async (): Promise<UserProfileStats> => {
    const response = await api.get<UserProfileStats>('/user/me/stats');
    return response.data;
  },

  getUserActivities: async (limit?: number): Promise<UserActivities> => {
    const params = limit ? { limit } : {};
    const response = await api.get<UserActivities>('/user/me/activities', { params });
    return response.data;
  },

  getUserPublicStats: async (userId: string): Promise<UserProfileStats & { followersCount?: number; followingCount?: number; level?: number; levelTitle?: string; achievementsCount?: number }> => {
    const response = await api.get(`/users/${userId}/public-stats`);
    return response.data;
  },

  getLevelConfigs: async (): Promise<Array<{ level: number; title: string; minExperience: number; maxExperience: number }>> => {
    const response = await api.get('/users/levels/config');
    return response.data;
  },
}; 