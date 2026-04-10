// Comment Types
export interface CommentUser {
  _id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

export interface Comment {
  _id: string;
  content: string;
  userId: CommentUser;
  createdAt: string;
  upvotes?: string[];
  downvotes?: string[];
  isBest: boolean;
  parentId?: string;
  childrenCount: number;
  depth?: number;
  replies?: Comment[];
}

export type VoteType = 'upvote' | 'downvote';
export type VoteStatus = 'upvoted' | 'downvoted' | 'none';
export type SortType = 'newest' | 'oldest' | 'mostVoted';

// Comment State Types
export interface CommentState {
  comments: Comment[];
  displayedComments: Comment[];
  loading: boolean;
  submitting: boolean;
  showAllComments: boolean;
  hasMoreComments: boolean;
  sortBy: SortType;
  expandedReplies: Set<string>;
}

// Comment Action Types
export interface CommentActions {
  replyingTo: string | null;
  replyContent: string;
  editingComment: string | null;
  editContent: string;
  replyToReply: string | null;
  replyToReplyContent: string;
  showMenu: string | null;
}

// Comment Form Types
export interface CommentFormData {
  content: string;
  parentId?: string;
}

// Comment API Response Types
export interface CommentApiResponse {
  success: boolean;
  comment: Comment;
  message?: string;
}

export interface CommentsApiResponse {
  success: boolean;
  comments: Comment[];
  total: number;
  message?: string;
}

// Comment Validation Types
export interface CommentValidation {
  isValid: boolean;
  errors: string[];
}

// Comment Permissions
export interface CommentPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canReply: boolean;
  canVote: boolean;
}

// Comment UI States
export interface CommentUIState {
  isExpanded: boolean;
  isEditing: boolean;
  isReplying: boolean;
  isVoting: boolean;
  showMenu: boolean;
}