/**
 * Forum Service
 * Forum posts, comments, categories and social interactions
 */
import apiClient from '@/lib/api-client';

const FORUM_BASE = '/forum';

export const forumApi = {
  // Post APIs
  getPosts: (page = 1, pageSize = 10, search = '', category = '') =>
    apiClient.get(
      `${FORUM_BASE}?page=${page}&pageSize=${pageSize}&search=${search}${
        category ? `&category=${encodeURIComponent(category)}` : ''
      }`,
    ),

  getPost: (id: string) => apiClient.get(`${FORUM_BASE}/${id}`),

  createPost: (data: unknown) => apiClient.post(FORUM_BASE, data),

  updatePost: (id: string, data: unknown) =>
    apiClient.put(`${FORUM_BASE}/${id}`, data),

  deletePost: (id: string) => apiClient.delete(`${FORUM_BASE}/${id}`),

  // Like/Unlike APIs
  likePost: (postId: string) => apiClient.post(`${FORUM_BASE}/${postId}/like`),
  unlikePost: (postId: string) => apiClient.post(`${FORUM_BASE}/${postId}/like`),

  // Save/Unsave APIs
  savePost: (postId: string) => apiClient.post(`${FORUM_BASE}/${postId}/save`),
  unsavePost: (postId: string) => apiClient.post(`${FORUM_BASE}/${postId}/save`),

  // Comment APIs
  getComments: (postId: string) => apiClient.get(`/comments/post/${postId}`),
  getCommentsByPostId: (postId: string) => apiClient.get(`/comments/post/${postId}`),

  createComment: (postId: string, content: string, parentId?: string) =>
    apiClient.post(`/comments/post/${postId}`, { content, parentId }),

  updateComment: (commentId: string, content: string) =>
    apiClient.put(`/comments/${commentId}`, { content }),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`),

  // Vote comment (upvote/downvote)
  voteComment: (commentId: string, voteType: 'upvote' | 'downvote') =>
    apiClient.post(`/comments/vote/${commentId}`, { voteType }),

  // Increment view count
  incrementView: (postId: string) =>
    apiClient.post(`${FORUM_BASE}/${postId}/view`),

  // Categories and Trending
  getCategories: () => apiClient.get(`${FORUM_BASE}/categories`),
  getTrending: () => apiClient.get(`${FORUM_BASE}/trending`),
  getTopSubjects: () => apiClient.get('/forum/categories'),

  // Follow/Unfollow
  followUser: (userId: string) =>
    apiClient.post(`${FORUM_BASE}/user/${userId}/follow`),
  unfollowUser: (userId: string) =>
    apiClient.delete(`${FORUM_BASE}/user/${userId}/follow`),
};
