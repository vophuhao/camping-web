import { useCallback } from 'react';
import { Comment, VoteType, VoteStatus } from '../types/comment';
import { formatTimeAgo } from "../utils/dateUtils";

export const useCommentUtils = () => {
  // Format time - use shared utility
  const formatTime = useCallback((dateString: string): string => {
    return formatTimeAgo(dateString);
  }, []);

  // Get vote status
  const getVoteStatus = useCallback((comment: Comment, currentUserId?: string): VoteStatus => {
    if (!currentUserId) return 'none';
    const upvotes = comment.upvotes || [];
    const downvotes = comment.downvotes || [];
    
    if (upvotes.includes(currentUserId)) return 'upvoted';
    if (downvotes.includes(currentUserId)) return 'downvoted';
    return 'none';
  }, []);

  // Calculate vote score
  const getVoteScore = useCallback((comment: Comment): number => {
    const upvotes = comment.upvotes || [];
    const downvotes = comment.downvotes || [];
    return upvotes.length - downvotes.length;
  }, []);

  // Update comment votes (optimistic update)
  const updateCommentVotes = useCallback((
    comment: Comment, 
    voteType: VoteType, 
    currentUserId: string
  ): Comment => {
    const upvotes = comment.upvotes || [];
    const downvotes = comment.downvotes || [];
    
    let newUpvotes = [...upvotes];
    let newDownvotes = [...downvotes];
    
    if (voteType === 'upvote') {
      if (upvotes.includes(currentUserId)) {
        newUpvotes = upvotes.filter(id => id !== currentUserId);
      } else {
        newUpvotes = [...upvotes, currentUserId];
        newDownvotes = downvotes.filter(id => id !== currentUserId);
      }
    } else {
      if (downvotes.includes(currentUserId)) {
        newDownvotes = downvotes.filter(id => id !== currentUserId);
      } else {
        newDownvotes = [...downvotes, currentUserId];
        newUpvotes = upvotes.filter(id => id !== currentUserId);
      }
    }
    
    return {
      ...comment,
      upvotes: newUpvotes,
      downvotes: newDownvotes,
    };
  }, []);

  // Get displayed replies
  const getDisplayedReplies = useCallback((
    replies: Comment[], 
    commentId: string, 
    expandedReplies: Set<string>
  ): Comment[] => {
    const isExpanded = expandedReplies.has(commentId);
    const initialReplyCount = 3;
    
    if (isExpanded || replies.length <= initialReplyCount) {
      return replies;
    }
    
    return replies.slice(0, initialReplyCount);
  }, []);

  // Calculate total comment count (including replies)
  const getTotalCommentCount = useCallback((comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  }, []);

  // Find comment by ID (including in replies)
  const findCommentById = useCallback((comments: Comment[], commentId: string): Comment | null => {
    for (const comment of comments) {
      if (comment._id === commentId) {
        return comment;
      }
      if (comment.replies) {
        for (const reply of comment.replies) {
          if (reply._id === commentId) {
            return reply;
          }
        }
      }
    }
    return null;
  }, []);

  // Update comment in tree
  const updateCommentInTree = useCallback((
    comments: Comment[], 
    commentId: string, 
    updates: Partial<Comment>
  ): Comment[] => {
    return comments.map(comment => {
      if (comment._id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies) {
        const updatedReplies = comment.replies.map(reply => 
          reply._id === commentId ? { ...reply, ...updates } : reply
        );
        if (JSON.stringify(updatedReplies) !== JSON.stringify(comment.replies)) {
          return { ...comment, replies: updatedReplies };
        }
      }
      return comment;
    });
  }, []);

  // Remove comment from tree
  const removeCommentFromTree = useCallback((
    comments: Comment[], 
    commentId: string
  ): Comment[] => {
    return comments.map(comment => {
      if (comment.replies) {
        const updatedReplies = comment.replies.filter(reply => reply._id !== commentId);
        if (updatedReplies.length !== comment.replies.length) {
          return { ...comment, replies: updatedReplies };
        }
      }
      return comment;
    }).filter(comment => comment._id !== commentId);
  }, []);

  // Add reply to comment
  const addReplyToComment = useCallback((
    comments: Comment[], 
    parentId: string, 
    newReply: Comment
  ): Comment[] => {
    return comments.map(comment => {
      if (comment._id === parentId) {
        return {
          ...comment,
          childrenCount: comment.childrenCount + 1,
          replies: [...(comment.replies || []), newReply],
        };
      }
      if (comment.replies) {
        const updatedReplies = comment.replies.map(reply => {
          if (reply._id === parentId) {
            return {
              ...reply,
              childrenCount: reply.childrenCount + 1,
              replies: [...(reply.replies || []), newReply],
            };
          }
          return reply;
        });
        if (JSON.stringify(updatedReplies) !== JSON.stringify(comment.replies)) {
          return { ...comment, replies: updatedReplies };
        }
      }
      return comment;
    });
  }, []);

  return {
    formatTime,
    getVoteStatus,
    getVoteScore,
    updateCommentVotes,
    getDisplayedReplies,
    getTotalCommentCount,
    findCommentById,
    updateCommentInTree,
    removeCommentFromTree,
    addReplyToComment,
  };
};