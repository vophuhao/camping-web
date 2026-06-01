/**
 * Auth Service
 * Client-side auth API calls (login, logout, Google OAuth)
 * Server Actions for registration/verification are in lib/actions/auth.actions.ts
 */
import apiClient from '@/lib/api-client';

export async function login(data: {
  email: string;
  password: string;
}): Promise<ApiResponse<User> | ErrorResponse> {
  try {
    return (await apiClient.post('/auth/login', data)) as ApiResponse<User>;
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
    return (await apiClient.post('/auth/login/google', data)) as ApiResponse<User>;
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
