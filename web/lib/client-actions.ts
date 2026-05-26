
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FavoriteItem } from '@/store/favorite.store';
import type { Booking } from '@/types/property-site';
import apiClient from './api-client';

// ==================== PROPERTY-SITE API ====================
// Re-export all Property-Site API functions for centralized access
export * from './property-site-api';

export async function login(data: {
  email: string;
  password: string;
}): Promise<ApiResponse<User> | ErrorResponse> {
  try {
    const response = (await apiClient.post(
      '/auth/login',
      data,
    )) as ApiResponse<User>;
    return response;
  } catch (error) {
    return error as ErrorResponse;
  }
}

export async function googleLogin(data: {
  email: string;
  name: string;
  picture: string;
  googleId: string;
}): Promise<ApiResponse<User> | ErrorResponse> {
  try {
    const response = (await apiClient.post(
      '/auth/login/google',
      data,
    )) as ApiResponse<User>;
    return response;
  } catch (error) {
    return error as ErrorResponse;
  }
}

export async function logout(): Promise<ApiResponse> {
  return apiClient.post('/auth/logout');
}

export async function refreshToken(): Promise<ApiResponse> {
  return apiClient.get('/auth/refresh');
}

// ================== USER API ==================
export const getAllUsers = async (): Promise<ApiResponse> =>
  apiClient.get('/users');

export const updateProfile = async (
  data: Partial<{ username: string; bio: string; avatar: string }>,
): Promise<ApiResponse> => apiClient.patch('/users/me', data);

export const getUserByUsername = async (
  username: string,
): Promise<ApiResponse> => apiClient.get(`/users/${username}`);

export const searchUsers = async (
  query: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse> =>
  apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);

export const getUserStats = async (
  username: string,
): Promise<
  ApiResponse<{
    bookings: number;
    orders: number;
    reviews: number;
    saves?: number;
  }>
> => apiClient.get(`/users/${username}/stats`);

export const getUserReviews = async (username: string): Promise<ApiResponse> =>
  apiClient.get(`/users/${username}/reviews`);

export async function uploadMedia(formData: FormData): Promise<ApiResponse> {
  return apiClient.post('/media/save', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ================== BOOKING API ==================
export async function createBooking(data: {
  // NEW: Property-Site architecture (site is required)
  site: string;
  property: string;

  // LEGACY: Old campsite (backward compatible)
  campsite?: string;

  // Shared fields
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfPets?: number;
  numberOfVehicles?: number;
  guestMessage?: string;
  paymentMethod: 'deposit' | 'full';
  fullnameGuest: string;
  phone?: string;
  email?: string;
}): Promise<ApiResponse<Booking>> {
  return apiClient.post('/bookings', data);
}

export async function getBooking(id: string): Promise<ApiResponse<Booking>> {
  return apiClient.get(`/bookings/${id}`);
}

export async function getBookingByCode(
  code: string,
): Promise<ApiResponse<Booking>> {
  return apiClient.post(`/bookings/${code}/code`);
}

export async function getUserBookings(params?: {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'refunded';
  role?: 'guest' | 'host';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<Booking[]>> {
  return apiClient.get('/bookings', { params });
}

export async function confirmBooking(
  bookingId: string,
  hostMessage?: string,
): Promise<ApiResponse<Booking>> {
  return apiClient.post(`/bookings/${bookingId}/confirm`, { hostMessage });
}

export async function cancelBooking(
  bookingId: string,
  data: {
    cancellationReason: string;
    cancellInformation?: {
      fullnameGuest: string;
      bankCode: string;
      bankType: string;
    };
  },
): Promise<ApiResponse<Booking>> {
  return apiClient.post(`/bookings/${bookingId}/cancel`, data);
}

export async function completeBooking(
  bookingId: string,
): Promise<ApiResponse<Booking>> {
  return apiClient.post(`/bookings/${bookingId}/complete`);
}

export async function refundBooking(
  bookingId: string,
): Promise<ApiResponse<Booking>> {
  return apiClient.post(`/bookings/${bookingId}/refund`);
}

export async function requestDissatisfaction(
  bookingId: string,
  data: {
    reason: string;
    phone: string;
    email: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    evidenceImages: string[];
  },
): Promise<ApiResponse<Booking>> {
  return apiClient.post(`/bookings/${bookingId}/dissatisfaction`, data);
}

export async function getAllAmenities(): Promise<ApiResponse<Amenity[]>> {
  return apiClient.get('/amenities');
}

// Deprecated: Activity model removed from backend
// export async function getAllActivities(): Promise<ApiResponse<Activity[]>> {
//   return apiClient.get('/activities');
// }

export async function getMyBookings(): Promise<ApiResponse<Booking[]>> {
  return apiClient.get('/bookings/my/list');
}

// ================== AVAILABILITY API ==================
export async function getBlockedDates(
  siteId: string,
  startDate: string,
  endDate: string,
): Promise<
  ApiResponse<{
    blockedDates: string[];
    totalBlocked: number;
  }>
> {
  return apiClient.get(`/sites/${siteId}/blocked-dates`, {
    params: { startDate, endDate },
  });
}

export async function getSiteAvailability(
  siteId: string,
  checkIn?: string,
  checkOut?: string,
): Promise<
  ApiResponse<{
    isAvailable: boolean;
    reason?: string;
    blockedDates?: string[];
  }>
> {
  const params = checkIn && checkOut ? { checkIn, checkOut } : {};
  return apiClient.get(`/sites/${siteId}/availability`, { params });
}

export async function getMyCampsitesReview(): Promise<ApiResponse<Reviews[]>> {
  return apiClient.get('/reviews/my');
}

// ================== REVIEW API (Property-Site) ==================
export async function createReview(data: {
  booking: string;
  property: string;
  site: string;
  propertyRatings: {
    location: number;
    communication: number;
    value: number;
  };
  siteRatings: {
    cleanliness: number;
    accuracy: number;
  };
  comment: string;
}): Promise<ApiResponse> {
  return apiClient.post('/reviews', data);
}

export async function getPropertyReviews(
  propertyId: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<any>> {
  return apiClient.get(`/properties/${propertyId}/reviews`, {
    params: { page, limit },
  });
}

export async function getSiteReviews(
  siteId: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<any>> {
  return apiClient.get(`/sites/${siteId}/reviews`, {
    params: { page, limit },
  });
}

export async function addHostResponse(
  reviewId: string,
  comment: string,
): Promise<ApiResponse> {
  return apiClient.post(`/reviews/${reviewId}/response`, { comment });
}

/**
 * Lấy hoặc tạo cuộc trò chuyện với 1 user khác
 */
export async function getOrCreateConversation(
  userId: string,
): Promise<ApiResponse> {
  return apiClient.post(`/messages/conversations`, { userId });
}

/**
 * Lấy danh sách conversation của user hiện tại
 */
export async function getUserConversations(): Promise<ApiResponse> {
  return apiClient.get(`/messages/conversations`);
}
/**
 * Xoá 1 conversation
 */
export async function deleteConversation(
  conversationId: string,
): Promise<ApiResponse> {
  return apiClient.delete(`/messages/${conversationId}`);
}

/**
 * Lưu trữ (archive) 1 conversation
 */
export async function archiveConversation(
  conversationId: string,
): Promise<ApiResponse> {
  return apiClient.put(`/messages/${conversationId}/archive`);
}

// =============================
// Messages
// =============================

/**
 * Gửi tin nhắn trong 1 conversation
 */
export async function sendMessageUser(
  conversationId: string,
  payload: any,
): Promise<ApiResponse> {
  return apiClient.post(`/messages/${conversationId}`, { payload });
}

/**
 * Lấy message trong 1 conversation
 */
export async function getMessages(
  conversationId: string,
): Promise<ApiResponse> {
  return apiClient.get(`/messages/${conversationId}`);
}

/**
 * Đánh dấu toàn bộ tin nhắn trong 1 conversation là đã đọc
 */
export async function markAsRead(conversationId: string): Promise<ApiResponse> {
  return apiClient.put(`/messages/${conversationId}/read`);
}

// =============================
// Unread global count
// =============================

/**
 * Lấy tổng số tin nhắn chưa đọc
 */
export async function getUnreadCount(): Promise<
  ApiResponse<{ count: number }>
> {
  return apiClient.get(`/messages/unread-count`);
}

export async function getRatingsByProductId(
  productId: string,
): Promise<ApiResponse> {
  return apiClient.get(`/rating/product/${productId}`);
}

export async function getAllRatings(): Promise<ApiResponse> {
  return apiClient.get(`/rating/all`);
}

export async function adminReplyToRating(
  id: string,
  message: string,
): Promise<ApiResponse> {
  return apiClient.post(`/rating/admin/reply/${id}`, { message });
}

export async function becomeHost(data: any): Promise<ApiResponse> {
  return apiClient.post(`/users/become-host`, data);
}

export async function verifyKycAndBecomeHost(data: {
  name: string;
  gmail: string;
  phone?: string;
  idNumber: string;
  faceMatchScore: number;
  selfieImage: string;
}): Promise<ApiResponse> {
  return apiClient.post(`/users/kyc-become-host`, data);
}


export async function getAllHostRequests(): Promise<ApiResponse> {
  return apiClient.get(`/users/become-host`);
}

export async function updateHostRequestStatus(
  id: string,
  status: 'pending' | 'approved' | 'rejected',
): Promise<ApiResponse> {
  return apiClient.post(`/users/update-status-host/${id}`, { status });
}

export async function getAllApprovedHosts(): Promise<ApiResponse> {
  return apiClient.get(`/users/hosts`);
}

export const getDashboardStats = async (type: string) => {
  return apiClient.get(`/dashboard/${type}`);
};

export const userCancelPayment = async (
  bookingId: string,
): Promise<ApiResponse> => {
  return apiClient.post(`/bookings/${bookingId}/cancel-payment`);
};

// ================== FAVORITE API ==================

/**
 * Add property to favorites
 */
export async function addPropertyToFavorites(
  propertyId: string,
  notes?: string,
): Promise<ApiResponse<FavoriteItem>> {
  return apiClient.post('/favorites', { property: propertyId, notes });
}

/**
 * Add site to favorites
 */
export async function addSiteToFavorites(
  siteId: string,
  notes?: string,
): Promise<ApiResponse<FavoriteItem>> {
  return apiClient.post('/favorites', { site: siteId, notes });
}

/**
 * Remove favorite by ID
 */
export async function removeFavorite(favoriteId: string): Promise<ApiResponse> {
  return apiClient.delete(`/favorites/${favoriteId}`);
}

/**
 * Remove property from favorites
 */
export async function removePropertyFromFavorites(
  propertyId: string,
): Promise<ApiResponse> {
  return apiClient.delete(`/favorites/property/${propertyId}`);
}

/**
 * Remove site from favorites
 */
export async function removeSiteFromFavorites(
  siteId: string,
): Promise<ApiResponse> {
  return apiClient.delete(`/favorites/site/${siteId}`);
}

/**
 * Get user's favorites with pagination
 */
export async function getUserFavorites(params?: {
  type?: 'property' | 'site' | 'all';
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<FavoriteItem>> {
  return apiClient.get('/favorites', { params });
}

/**
 * Check if property is favorited
 */
export async function isPropertyFavorited(
  propertyId: string,
): Promise<ApiResponse<{ isFavorited: boolean }>> {
  return apiClient.get(`/favorites/check/property/${propertyId}`);
}

/**
 * Check if site is favorited
 */
export async function isSiteFavorited(
  siteId: string,
): Promise<ApiResponse<{ isFavorited: boolean }>> {
  return apiClient.get(`/favorites/check/site/${siteId}`);
}

/**
 * Update favorite notes
 */
export async function updateFavoriteNotes(
  favoriteId: string,
  notes?: string,
): Promise<ApiResponse<FavoriteItem>> {
  return apiClient.patch(`/favorites/${favoriteId}/notes`, { notes });
}


export async function getAllOrders(): Promise<ApiResponse> {
  return apiClient.get('/orders');
}

export async function blockedUser(id: string): Promise<ApiResponse> {
  return apiClient.post(`/users/block-user/${id}`);
}

// ================== WALLET API ==================
export async function getWalletBalance(): Promise<ApiResponse> {
  return apiClient.get('/wallet/balance');
}

export async function getWalletTransactions(page = 1, limit = 20): Promise<ApiResponse> {
  return apiClient.get('/wallet/transactions', { params: { page, limit } });
}

export async function createWithdrawalRequest(amount: number): Promise<ApiResponse> {
  return apiClient.post('/wallet/withdraw', { amount });
}

export async function getMyWithdrawals(page = 1, limit = 20): Promise<ApiResponse> {
  return apiClient.get('/wallet/withdrawals', { params: { page, limit } });
}

export async function guestConfirmArrival(bookingId: string): Promise<ApiResponse> {
  return apiClient.post(`/bookings/${bookingId}/confirm-arrival`);
}

export async function guestCannotAttend(
  bookingId: string,
  data: {
    reason: string;
    bankAccountName: string;
    bankAccountNumber: string;
    bankName: string;
    evidenceImages?: string[];
  }
): Promise<ApiResponse> {
  return apiClient.post(`/bookings/${bookingId}/cannot-attend`, data);
}

// Admin wallet routes
export async function adminGetAllWithdrawals(params?: Record<string, unknown>): Promise<ApiResponse> {
  return apiClient.get('/wallet/admin/withdrawals', { params });
}

export async function adminProcessWithdrawal(
  withdrawalId: string,
  approved: boolean,
  adminNote?: string
): Promise<ApiResponse> {
  return apiClient.post(`/wallet/admin/withdrawals/${withdrawalId}/process`, {
    approved,
    adminNote,
  });
}
