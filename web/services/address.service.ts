/**
 * Address Service
 * User delivery address management
 */
import apiClient from '@/lib/api-client';

export const getAddresses = async (): Promise<ApiResponse> =>
  apiClient.get('/address');

export const addAddress = async (payload: Address): Promise<ApiResponse> =>
  apiClient.post('/address', payload);

export const removeAddress = async (index: number): Promise<ApiResponse> =>
  apiClient.delete(`/address/${index}`);

export const setDefaultAddress = async (index: number): Promise<ApiResponse> =>
  apiClient.patch(`/address/${index}/default`);
