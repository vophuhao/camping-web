import { useState, useCallback } from 'react';
import { Comment, CommentState, SortType } from '../types/comment';

const INITIAL_DISPLAY_COUNT = 3;

export const useCommentState = (_postId: string) => {
  const [state, setState] = useState<CommentState>({
    comments: [],
    displayedComments: [],
    loading: false,
    submitting: false,
    showAllComments: false,
    hasMoreComments: false,
    sortBy: 'newest',
    expandedReplies: new Set(),
  });

  // Update state helper
  const updateState = useCallback((updates: Partial<CommentState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Sort comments
  const sortComments = useCallback((comments: Comment[], sortBy: SortType): Comment[] => {
    const sortedComments = [...comments];
    
    switch (sortBy) {
      case 'newest':
        return sortedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'oldest':
        return sortedComments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case 'mostVoted':
        return sortedComments.sort((a, b) => {
          const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
          const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
          return scoreB - scoreA;
        });
      default:
        return sortedComments;
    }
  }, []);

  // Update displayed comments
  const updateDisplayedComments = useCallback((comments: Comment[], showAll: boolean) => {
    const sortedComments = sortComments(comments, state.sortBy);
    
    if (showAll) {
      updateState({
        displayedComments: sortedComments,
        hasMoreComments: false,
        showAllComments: true,
      });
    } else {
      const displayed = sortedComments.slice(0, INITIAL_DISPLAY_COUNT);
      updateState({
        displayedComments: displayed,
        hasMoreComments: sortedComments.length > INITIAL_DISPLAY_COUNT,
        showAllComments: false,
      });
    }
  }, [state.sortBy, sortComments, updateState]);

  // Add new comment
  const addComment = useCallback((newComment: Comment) => {
    const updatedComments = [newComment, ...state.comments];
    updateState({ comments: updatedComments });
    updateDisplayedComments(updatedComments, state.showAllComments);
  }, [state.comments, state.showAllComments, updateState, updateDisplayedComments]);

  // Update comment
  const updateComment = useCallback((commentId: string, updates: Partial<Comment>) => {
    const updatedComments = state.comments.map(comment => 
      comment._id === commentId ? { ...comment, ...updates } : comment
    );
    updateState({ comments: updatedComments });
    updateDisplayedComments(updatedComments, state.showAllComments);
  }, [state.comments, state.showAllComments, updateState, updateDisplayedComments]);

  // Remove comment
  const removeComment = useCallback((commentId: string) => {
    const updatedComments = state.comments.filter(comment => comment._id !== commentId);
    updateState({ comments: updatedComments });
    updateDisplayedComments(updatedComments, state.showAllComments);
  }, [state.comments, state.showAllComments, updateState, updateDisplayedComments]);

  // Add reply
  const addReply = useCallback((parentId: string, newReply: Comment) => {
    const updatedComments = state.comments.map(comment => {
      if (comment._id === parentId) {
        return {
          ...comment,
          childrenCount: comment.childrenCount + 1,
          replies: [...(comment.replies || []), newReply],
        };
      }
      return comment;
    });
    updateState({ comments: updatedComments });
    updateDisplayedComments(updatedComments, state.showAllComments);
  }, [state.comments, state.showAllComments, updateState, updateDisplayedComments]);

  // Toggle expanded replies
  const toggleExpandedReplies = useCallback((commentId: string) => {
    const newExpandedReplies = new Set(state.expandedReplies);
    if (newExpandedReplies.has(commentId)) {
      newExpandedReplies.delete(commentId);
    } else {
      newExpandedReplies.add(commentId);
    }
    updateState({ expandedReplies: newExpandedReplies });
  }, [state.expandedReplies, updateState]);

  // Change sort
  const changeSort = useCallback((newSortBy: SortType) => {
    updateState({ sortBy: newSortBy });
    updateDisplayedComments(state.comments, state.showAllComments);
  }, [state.comments, state.showAllComments, updateState, updateDisplayedComments]);

  // Load all comments
  const loadAllComments = useCallback(() => {
    updateDisplayedComments(state.comments, true);
  }, [state.comments, updateDisplayedComments]);

  return {
    state,
    updateState,
    addComment,
    updateComment,
    removeComment,
    addReply,
    toggleExpandedReplies,
    changeSort,
    loadAllComments,
    sortComments,
  };
};