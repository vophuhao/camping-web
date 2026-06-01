/**
 * Message Service
 * Direct messaging and conversation management
 */
import apiClient from '@/lib/api-client';

/** Get or create a conversation with another user */
export async function getOrCreateConversation(userId: string): Promise<ApiResponse> {
  return apiClient.post('/messages/conversations', { userId });
}

/** Get all conversations for the current user */
export async function getUserConversations(): Promise<ApiResponse> {
  return apiClient.get('/messages/conversations');
}

/** Delete a conversation */
export async function deleteConversation(conversationId: string): Promise<ApiResponse> {
  return apiClient.delete(`/messages/${conversationId}`);
}

/** Archive a conversation */
export async function archiveConversation(conversationId: string): Promise<ApiResponse> {
  return apiClient.put(`/messages/${conversationId}/archive`);
}

/** Send a message in a conversation */
export async function sendMessage(
  conversationId: string,
  payload: unknown,
): Promise<ApiResponse> {
  return apiClient.post(`/messages/${conversationId}`, { payload });
}

/** @deprecated Use sendMessage instead */
export const sendMessageUser = sendMessage;


/** Get messages in a conversation */
export async function getMessages(conversationId: string): Promise<ApiResponse> {
  return apiClient.get(`/messages/${conversationId}`);
}

/** Mark all messages in a conversation as read */
export async function markAsRead(conversationId: string): Promise<ApiResponse> {
  return apiClient.put(`/messages/${conversationId}/read`);
}

/** Get total unread message count */
export async function getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
  return apiClient.get('/messages/unread-count');
}

// ================== SUPPORT CHAT ==================

export const createSupportConversation = async (): Promise<ApiResponse> =>
  apiClient.post('/support/createConversation');

export const sendSupportMessage = async (
  conversationId: string,
  senderId: string,
  content: string,
): Promise<ApiResponse> =>
  apiClient.post('/support/sendMessage', { conversationId, senderId, content });

export const getSupportMessages = async (
  conversationId: string,
  limit = 50,
  skip = 0,
): Promise<ApiResponse> =>
  apiClient.get('/support/messages', { params: { conversationId, limit, skip } });
