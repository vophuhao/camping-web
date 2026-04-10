/* eslint-disable @typescript-eslint/no-explicit-any */
import api from './api-client';

export interface GenerateContentRequest {
  title: string;
  subject: string;
  summary?: string;
}

export interface GenerateContentResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface GenerateSummaryRequest {
  title: string;
  subject: string;
}

export interface GenerateSummaryResponse {
  success: boolean;
  summary?: string;
  error?: string;
}

export interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  full: string;
  download: string;
  downloadLocation?: string;
  description: string;
  author: {
    name: string;
    username: string;
    profile: string;
  };
  unsplashUrl?: string;
  width: number;
  height: number;
}

export interface SearchImagesResponse {
  success: boolean;
  images?: UnsplashImage[];
  error?: string;
}

export interface ImageSuggestionsResponse {
  success: boolean;
  images?: UnsplashImage[];
  error?: string;
}

export interface GenerateImagePromptRequest {
  title: string;
  subject: string;
}

export interface GenerateImagePromptResponse {
  success: boolean;
  prompt?: string;
  error?: string;
}

/**
 * Generate post content using AI (Gemini Pro)
 */
export const generatePostContent = async (
  data: GenerateContentRequest
): Promise<GenerateContentResponse> => {
  try {
    const response = await api.post<GenerateContentResponse>('/ai/generate-content', data);
    return response.data;
  } catch (error: any) {
    console.error('Error generating content:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to generate content'
    };
  }
};

/**
 * Generate post summary using AI (Gemini Pro)
 */
export const generatePostSummary = async (
  data: GenerateSummaryRequest
): Promise<GenerateSummaryResponse> => {
  try {
    const response = await api.post<GenerateSummaryResponse>('/ai/generate-summary', data);
    return response.data;
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to generate summary'
    };
  }
};

/**
 * Search images from Unsplash
 */
export const searchImages = async (
  query: string,
  perPage: number = 5
): Promise<SearchImagesResponse> => {
  try {
    const response = await api.get<SearchImagesResponse>('/ai/search-images', {
      params: { query, perPage }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error searching images:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to search images'
    };
  }
};

/**
 * Get image suggestions based on post title and subject
 */
export const getImageSuggestions = async (
  title: string,
  subject: string
): Promise<ImageSuggestionsResponse> => {
  try {
    const response = await api.get<ImageSuggestionsResponse>('/ai/image-suggestions', {
      params: { title, subject }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error getting image suggestions:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get image suggestions'
    };
  }
};

/**
 * Generate image prompt (for future use with DALL-E)
 */
export const generateImagePrompt = async (
  data: GenerateImagePromptRequest
): Promise<GenerateImagePromptResponse> => {
  try {
    const response = await api.post<GenerateImagePromptResponse>('/ai/generate-image-prompt', data);
    return response.data;
  } catch (error: any) {
    console.error('Error generating image prompt:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to generate image prompt'
    };
  }
};

export interface GenerateImageRequest {
  prompt?: string;
  title?: string;
  subject?: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
}

export interface GenerateImageResponse {
  success: boolean;
  imageUrl?: string;
  revisedPrompt?: string;
  error?: string;
}

/**
 * Generate image using DALL-E 3
 */
export const generateImage = async (
  data: GenerateImageRequest
): Promise<GenerateImageResponse> => {
  try {
    const response = await api.post<GenerateImageResponse>('/ai/generate-image', data);
    return response.data;
  } catch (error: any) {
    console.error('Error generating image:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to generate image'
    };
  }
};