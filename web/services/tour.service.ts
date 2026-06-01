import apiClient from '@/lib/api-client';

export async function getTours(
  page = 1,
  limit = 10,
  search?: string,
): Promise<PaginatedResponse<Tour>> {
  return apiClient.get('/tours', { params: { page, limit, search } });
}

export async function getAllTours(): Promise<ApiResponse<Tour[]>> {
  return apiClient.get('/tours/all');
}

export async function getTourById(id: string): Promise<ApiResponse<Tour>> {
  return apiClient.get(`/tours/${id}`);
}

export async function getTourBySlug(slug: string): Promise<ApiResponse<Tour>> {
  return apiClient.get(`/tours/slug/${slug}`);
}

export async function createTour(data: any): Promise<ApiResponse<Tour>> {
  return apiClient.post('/tours', data);
}

export async function updateTour(id: string, data: any): Promise<ApiResponse<Tour>> {
  return apiClient.put(`/tours/${id}`, data);
}

export async function deleteTour(id: string): Promise<ApiResponse> {
  return apiClient.delete(`/tours/${id}`);
}

export async function activateTour(id: string): Promise<ApiResponse> {
  return apiClient.patch(`/tours/activate/${id}`);
}

export async function deactivateTour(id: string): Promise<ApiResponse> {
  return apiClient.patch(`/tours/deactivate/${id}`);
}
