/**
 * Wallet Service
 * Wallet balance, transactions, and withdrawals
 */
import apiClient from '@/lib/api-client';

export async function getWalletBalance(): Promise<ApiResponse> {
  return apiClient.get('/wallet/balance');
}

export async function getWalletTransactions(
  page = 1,
  limit = 20,
): Promise<ApiResponse> {
  return apiClient.get('/wallet/transactions', { params: { page, limit } });
}

export async function createWithdrawalRequest(amount: number): Promise<ApiResponse> {
  return apiClient.post('/wallet/withdraw', { amount });
}

export async function getMyWithdrawals(
  page = 1,
  limit = 20,
): Promise<ApiResponse> {
  return apiClient.get('/wallet/withdrawals', { params: { page, limit } });
}

// ================== ADMIN ==================

export async function adminGetAllWithdrawals(
  params?: Record<string, unknown>,
): Promise<ApiResponse> {
  return apiClient.get('/wallet/admin/withdrawals', { params });
}

export async function adminProcessWithdrawal(
  withdrawalId: string,
  approved: boolean,
  adminNote?: string,
): Promise<ApiResponse> {
  return apiClient.post(`/wallet/admin/withdrawals/${withdrawalId}/process`, {
    approved,
    adminNote,
  });
}
