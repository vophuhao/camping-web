import apiClient from '@/lib/api-client';

export async function createProduct(data: any): Promise<ApiResponse> {
  return apiClient.post('/products', data);
}

export async function updateProduct(id: string, data: any): Promise<ApiResponse> {
  return apiClient.put(`/products/${id}`, data);
}

export async function getProduct(
  page = 1,
  limit = 10,
  search?: string,
): Promise<ApiResponse<Product[]>> {
  return apiClient.get('/products', {
    params: { page, limit, search },
  });
}

export async function getProductBySlug(slug: string): Promise<ApiResponse> {
  return apiClient.get(`/products/slug/${slug}`);
}

export async function getAllProduct(): Promise<ApiResponse<Product[]>> {
  return apiClient.get('/products/all');
}

export async function deleteProduct(id: string): Promise<ApiResponse> {
  return apiClient.delete(`/products/${id}`);
}

export async function getProductsByCategoryName(
  categoryName: string,
  page = 1,
  limit = 10,
): Promise<ApiResponse<Product[]>> {
  return apiClient.get(
    `/products/category/${encodeURIComponent(categoryName)}`,
    {
      params: { page, limit },
    },
  );
}

