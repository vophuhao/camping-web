

// Type cho quyền riêng tư bài viết
export type ForumPostVisibility = 'public' | 'private';

// Type cho badge đặc biệt
export type ForumPostBadge = 'new' | 'hot' | 'ai' | 'featured';

// Type cho tag/chủ đề
export interface ForumTag {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

// Type cho tác giả
export interface ForumAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
  isFollowed?: boolean;
}

// Type bài viết diễn đàn
export interface ForumPost {
  _id?: string;
  id: string;
  title: string;
  summary: string;
  content?: string;
  imageUrl?: string;
  images?: string[];
  author: ForumAuthor;
  createdAt: string;
  updatedAt?: string;
  tags?: ForumTag[];
  category?: string;
  subject?: string;
  visibility: ForumPostVisibility;
  badge?: ForumPostBadge;
  likeCount: number;
  commentCount: number;
  viewCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  slug?: string;
}

// Type trending
export interface ForumTrendingItem {
  id: string;
  title: string;
  likeCount: number;
  commentCount: number;
  author: ForumAuthor;
}

export interface Comment {
  _id: string;
  userId: User | string;
  content: string;
  createdAt: string;
  likes: string[];
  isLiked?: boolean;
  likeCount?: number;
  parentId?: string;
}

export interface ForumResponse {
  post: ForumPost;
}

export interface ForumListResponse {
  posts: ForumPost[];
  currentPage: number;
  totalPages: number;
  totalPosts: number;
}

export interface CommentResponse {
  comments: Comment[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PostForEdit {
  id: string;
  title: string;
  content: string;
  images?: string[];
  visibility: 'public' | 'private';
}