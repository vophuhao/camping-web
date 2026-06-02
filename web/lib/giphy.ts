/**
 * Giphy API Service
 * Sử dụng Giphy API để tìm kiếm và lấy sticker/GIF
 * 
 * Note: Bạn có thể sử dụng public beta key hoặc tạo API key riêng tại https://developers.giphy.com/
 * Public beta key có rate limit thấp nhưng đủ cho development
 */

const GIPHY_API_KEY = 'Mh0f0D4gP4XpL1IQYtY2gZ7XJ4l7Jq8V'; // Public beta key - có thể thay thế
const GIPHY_BASE_URL = 'https://api.giphy.com/v1';

export interface GiphyImage {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
    downsized: {
      url: string;
      width: string;
      height: string;
    };
  };
  url: string;
}

export interface GiphyResponse {
  data: GiphyImage[];
  pagination?: {
    total_count: number;
    count: number;
    offset: number;
  };
}

export const giphyApi = {
  /**
   * Tìm kiếm sticker/GIF theo từ khóa
   */
  search: async (query: string, limit: number = 20, offset: number = 0): Promise<GiphyImage[]> => {
    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/stickers/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=en`
      );
      const data: GiphyResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Giphy search error:', error);
      return [];
    }
  },

  /**
   * Lấy trending sticker/GIF
   */
  getTrending: async (limit: number = 25): Promise<GiphyImage[]> => {
    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/stickers/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
      );
      const data: GiphyResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Giphy trending error:', error);
      return [];
    }
  },

  /**
   * Tìm kiếm GIF (không phải sticker) nếu cần
   */
  searchGIFs: async (query: string, limit: number = 20, offset: number = 0): Promise<GiphyImage[]> => {
    try {
      const response = await fetch(
        `${GIPHY_BASE_URL}/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g&lang=en`
      );
      const data: GiphyResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Giphy GIF search error:', error);
      return [];
    }
  },

  /**
   * Lấy sticker/GIF URL để hiển thị
   */
  getImageUrl: (gif: GiphyImage, size: 'small' | 'medium' | 'large' | 'original' = 'medium'): string => {
    switch (size) {
      case 'small':
        return gif.images.fixed_height_small.url;
      case 'medium':
        return gif.images.fixed_height.url;
      case 'large':
        return gif.images.downsized.url;
      case 'original':
        return gif.images.original.url;
      default:
        return gif.images.fixed_height.url;
    }
  },
};