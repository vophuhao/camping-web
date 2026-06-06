import { useCallback } from 'react';
import { Comment, CommentPermissions } from '../types/comment';

export const useCommentPermissions = () => {
  // Check if user can edit comment
  const canEditComment = useCallback((comment: Comment, currentUserId?: string): boolean => {
    if (!currentUserId) return false;
    // Handle both object and string userId
    const commentUserId = typeof comment.userId === 'string' 
      ? comment.userId 
      : comment.userId?._id;
    return commentUserId === currentUserId;
  }, []);

  // Check if user can delete comment
  const canDeleteComment = useCallback((comment: Comment, currentUserId?: string): boolean => {
    if (!currentUserId) return false;
    // Handle both object and string userId
    const commentUserId = typeof comment.userId === 'string' 
      ? comment.userId 
      : comment.userId?._id;
    return commentUserId === currentUserId;
  }, []);

  // Check if user can reply to comment
  const canReplyToComment = useCallback((currentUserId?: string): boolean => {
    return !!currentUserId;
  }, []);

  // Check if user can vote on comment
  const canVoteComment = useCallback((currentUserId?: string): boolean => {
    return !!currentUserId;
  }, []);

  // Check if user can mark comment as best answer
  const canMarkBestAnswer = useCallback((comment: Comment, currentUserId?: string, _postAuthorId?: string): boolean => {
    if (!currentUserId) return false;
    return !comment.isBest;
  }, []);

  const canReportComment = useCallback((comment: Comment, currentUserId?: string): boolean => {
    if (!currentUserId) return false;
    const commentUserId = typeof comment.userId === 'string' 
      ? comment.userId 
      : comment.userId?._id;
    return commentUserId !== currentUserId; // Can't report own comment
  }, []);

  // Get all permissions for a comment
  const getCommentPermissions = useCallback((
    comment: Comment, 
    currentUserId?: string, 
    _postAuthorId?: string
  ): CommentPermissions => {
    return {
      canEdit: canEditComment(comment, currentUserId),
      canDelete: canDeleteComment(comment, currentUserId),
      canReply: canReplyToComment(currentUserId),
      canVote: canVoteComment(currentUserId),
    };
  }, [canEditComment, canDeleteComment, canReplyToComment, canVoteComment]);

  // Check if user is comment author
  const isCommentAuthor = useCallback((comment: Comment, currentUserId?: string): boolean => {
    if (!currentUserId) return false;
    const commentUserId = typeof comment.userId === 'string' 
      ? comment.userId 
      : comment.userId?._id;
    return commentUserId === currentUserId;
  }, []);

  // Check if user is post author
  const isPostAuthor = useCallback((currentUserId?: string, _postAuthorId?: string): boolean => {
    if (!currentUserId) return false;
    return false; // Simplified for now
  }, []);

  // Check if comment is from post author
  const isCommentFromPostAuthor = useCallback((_comment: Comment, _postAuthorId?: string): boolean => {
    return false; // Simplified for now
  }, []);

  return {
    canEditComment,
    canDeleteComment,
    canReplyToComment,
    canVoteComment,
    canMarkBestAnswer,
    canReportComment,
    getCommentPermissions,
    isCommentAuthor,
    isPostAuthor,
    isCommentFromPostAuthor,
  };
};