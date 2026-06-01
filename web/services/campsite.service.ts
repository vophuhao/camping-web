import apiClient from '@/lib/api-client';

/**
 * Create a new campsite (legacy)
 */
export async function createCampsite(data: any): Promise<ApiResponse<Campsite>> {
  return apiClient.post('/campsites', data);
}

/**
 * Update an existing campsite (legacy)
 */
export async function updateCampsite(
  id: string,
  data: any,
): Promise<ApiResponse<Campsite>> {
  return apiClient.patch(`/campsites/${id}`, data);
}

/**
 * Delete a campsite (legacy)
 */
export async function deleteCampsite(id: string): Promise<ApiResponse> {
  return apiClient.delete(`/campsites/${id}`);
}

/**
 * Get all campsites owned by the current host (legacy)
 */
export async function getMyCampsites(): Promise<ApiResponse<Campsite[]>> {
  return apiClient.get('/campsites/my/list');
}
