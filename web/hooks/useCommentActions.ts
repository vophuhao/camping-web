import { useState, useCallback } from 'react';
import { CommentActions } from '../types/comment';

export const useCommentActions = () => {
  const [actions, setActions] = useState<CommentActions>({
    replyingTo: null,
    replyContent: '',
    editingComment: null,
    editContent: '',
    replyToReply: null,
    replyToReplyContent: '',
    showMenu: null,
  });

  // Update actions helper
  const updateActions = useCallback((updates: Partial<CommentActions>) => {
    setActions(prev => ({ ...prev, ...updates }));
  }, []);

  // Reply actions
  const startReply = useCallback((commentId: string) => {
    updateActions({
      replyingTo: commentId,
      replyContent: '',
      replyToReply: null,
      replyToReplyContent: '',
    });
  }, [updateActions]);

  const cancelReply = useCallback(() => {
    updateActions({
      replyingTo: null,
      replyContent: '',
    });
  }, [updateActions]);

  const updateReplyContent = useCallback((content: string) => {
    updateActions({ replyContent: content });
  }, [updateActions]);

  // Reply to reply actions
  const startReplyToReply = useCallback((replyId: string) => {
    updateActions({
      replyToReply: replyId,
      replyToReplyContent: '',
      replyingTo: null,
      replyContent: '',
    });
  }, [updateActions]);

  const cancelReplyToReply = useCallback(() => {
    updateActions({
      replyToReply: null,
      replyToReplyContent: '',
    });
  }, [updateActions]);

  const updateReplyToReplyContent = useCallback((content: string) => {
    updateActions({ replyToReplyContent: content });
  }, [updateActions]);

  // Edit actions
  const startEdit = useCallback((commentId: string, content: string) => {
    updateActions({
      editingComment: commentId,
      editContent: content,
    });
  }, [updateActions]);

  const cancelEdit = useCallback(() => {
    updateActions({
      editingComment: null,
      editContent: '',
    });
  }, [updateActions]);

  const updateEditContent = useCallback((content: string) => {
    updateActions({ editContent: content });
  }, [updateActions]);

  // Menu actions
  const toggleMenu = useCallback((commentId: string | null) => {
    updateActions({ showMenu: commentId });
  }, [updateActions]);

  const closeMenu = useCallback(() => {
    updateActions({ showMenu: null });
  }, [updateActions]);

  // Reset all actions
  const resetActions = useCallback(() => {
    setActions({
      replyingTo: null,
      replyContent: '',
      editingComment: null,
      editContent: '',
      replyToReply: null,
      replyToReplyContent: '',
      showMenu: null,
    });
  }, []);

  return {
    actions,
    // Reply actions
    startReply,
    cancelReply,
    updateReplyContent,
    // Reply to reply actions
    startReplyToReply,
    cancelReplyToReply,
    updateReplyToReplyContent,
    // Edit actions
    startEdit,
    cancelEdit,
    updateEditContent,
    // Menu actions
    toggleMenu,
    closeMenu,
    // Utility
    resetActions,
  };
};