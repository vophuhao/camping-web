/**
 * Notification Service
 * User notification management
 */
import apiClient from '@/lib/api-client';
import type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
} from '@/types/notification';

export const notificationApi = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; modifiedCount: number }> => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: string): Promise<{ success: boolean }> => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  deleteAllNotifications: async (): Promise<{ success: boolean; deletedCount: number }> => {
    const response = await apiClient.delete('/notifications');
    return response.data;
  },
};
