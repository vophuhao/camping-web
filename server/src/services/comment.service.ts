import Comment from "../models/comment.model";
import ForumPost from "../models/forum.post.model";
import NotificationService from "./notification.service";

export interface GetCommentsByPostInput {
  page: number;
  pageSize: number;
}

export interface VoteCommentInput {
  voteType: "upvote" | "downvote";
}

export class CommentService {
  /**
   * Create a new comment or reply
   */
  async createComment(
    postId: string,
    userId: string,
    content: string,
    parentId?: string | null
  ): Promise<any> {
    if (!content) {
      throw new Error("content là bắt buộc.");
    }

    const post = await ForumPost.findById(postId);
    if (!post) {
      throw new Error("Bài viết không tồn tại.");
    }

    // Nếu là reply, kiểm tra comment cha có tồn tại không
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        throw new Error("Comment cha không tồn tại.");
      }
    }

    const commentData = {
      postId,
      userId,
      parentId: parentId || null,
      content,
      depth: parentId ? 1 : 0,
    };

    const comment = await Comment.create(commentData);

    // Award XP to commenter (silently fail if service not available)
    try {
      // XP service not yet implemented, skipping for now
      // await awardXP(userId, 10, "create_comment", comment._id);
    } catch {
      // Silent fail for XP award
    }

    // Nếu là reply, cập nhật childrenCount của comment cha
    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, {
        $inc: { childrenCount: 1 },
      });
    }

    // Tạo thông báo sử dụng NotificationService (silently fail if methods not yet implemented)
    try {
      const notificationService = new NotificationService();
      if (parentId) {
        // Nếu là reply, tạo thông báo cho chủ comment gốc
        const parentComment = await Comment.findById(parentId);
        if (parentComment && (notificationService as any).createReplyNotification) {
          await (notificationService as any).createReplyNotification(
            comment,
            parentComment,
            post
          );
        }
      } else {
        // Nếu là comment gốc, tạo thông báo cho chủ bài viết
        if ((notificationService as any).createCommentNotification) {
          await (notificationService as any).createCommentNotification(comment, post);
        }
      }
    } catch {
      // Silent fail for notifications
    }

    // Populate user info trước khi trả về
    await comment.populate("userId", "name avatarUrl");

    return comment;
  }

  /**
   * Get comments by post with pagination
   */
  async getCommentsByPost(
    postId: string,
    input: GetCommentsByPostInput
  ): Promise<{
    comments: any[];
    total: number;
    totalComments: number;
    page: number;
    pageSize: number;
  }> {
    const { page, pageSize } = input;

    // Lấy comments gốc (không có parentId)
    const rootComments = await Comment.find({
      postId,
      parentId: null,
      status: "active",
    })
      .sort({ createdAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("userId", "name avatarUrl");

    // Lấy tất cả replies (cả depth = 1 và depth = 2)
    const allReplies = await Comment.find({
      postId,
      parentId: { $exists: true, $ne: null },
      status: "active",
    })
      .sort({ createdAt: 1 })
      .populate("userId", "name avatarUrl");

    // Tổ chức comments thành cấu trúc đơn giản - tất cả replies cùng cấp
    const commentsWithReplies = rootComments.map((comment: any) => {
      // Lấy tất cả replies của comment này (cả direct và nested ở mọi cấp độ)
      const commentReplies = allReplies.filter((reply: any) => {
        // Reply trực tiếp của comment gốc
        if (reply.parentId.toString() === comment._id.toString()) {
          return true;
        }

        // Kiểm tra tất cả các cấp độ nested replies
        let currentReply = reply;
        let depth = 0;
        const maxDepth = 10; // Giới hạn để tránh vòng lặp vô hạn

        while (currentReply.parentId && depth < maxDepth) {
          const parentReply = allReplies.find(
            (r: any) => r._id.toString() === currentReply.parentId.toString()
          );
          if (!parentReply) break;

          // Nếu parent của reply này là comment gốc, thì đây là nested reply của comment gốc
          if (
            parentReply.parentId &&
            parentReply.parentId.toString() === comment._id.toString()
          ) {
            return true;
          }

          // Tiếp tục tìm parent của parent
          currentReply = parentReply;
          depth++;
        }

        return false;
      });

      return {
        ...comment.toObject(),
        replies: commentReplies,
        upvotes: comment.upvotes || [],
        downvotes: comment.downvotes || [],
        childrenCount: comment.childrenCount || 0,
      };
    });

    // Đếm tổng số comments (cả gốc và replies)
    const totalComments = await Comment.countDocuments({
      postId,
      status: "active",
    });

    // Đếm số comments gốc (để phân trang)
    const totalRootComments = await Comment.countDocuments({
      postId,
      parentId: null,
      status: "active",
    });

    return {
      comments: commentsWithReplies,
      total: totalRootComments, // Số comments gốc để phân trang
      totalComments: totalComments, // Tổng số bình luận (cả gốc và replies)
      page,
      pageSize,
    };
  }

  /**
   * Delete a comment (only comment author or post author can delete)
   */
  async deleteComment(
    commentId: string,
    userId: string
  ): Promise<{ message: string }> {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error("Comment không tồn tại.");
    }

    const post = await ForumPost.findById(comment.postId);
    if (!post) {
      throw new Error("Bài viết không tồn tại.");
    }

    if (
      comment.userId.toString() !== userId.toString() &&
      post.userId.toString() !== userId.toString()
    ) {
      throw new Error("Không có quyền xóa comment này.");
    }

    await comment.deleteOne();
    return { message: "Đã xóa comment." };
  }

  /**
   * Vote comment (upvote/downvote)
   */
  async voteComment(
    commentId: string,
    userId: string,
    input: VoteCommentInput
  ): Promise<{
    success: boolean;
    upvotes: number;
    downvotes: number;
    voteScore: number;
    userVote: string;
  }> {
    const { voteType } = input;

    if (!["upvote", "downvote"].includes(voteType)) {
      throw new Error("Vote type không hợp lệ");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new Error("Comment không tồn tại");
    }

    const upvotes = comment.upvotes || [];
    const downvotes = comment.downvotes || [];

    let newUpvotes = [...upvotes];
    let newDownvotes = [...downvotes];

    if (voteType === "upvote") {
      if (upvotes.includes(userId)) {
        // Nếu đã upvote thì bỏ upvote
        newUpvotes = upvotes.filter(
          (id: any) => id.toString() !== userId.toString()
        );
      } else {
        // Thêm upvote và bỏ downvote nếu có
        newUpvotes = [...upvotes, userId];
        newDownvotes = downvotes.filter(
          (id: any) => id.toString() !== userId.toString()
        );
      }
    } else {
      if (downvotes.includes(userId)) {
        // Nếu đã downvote thì bỏ downvote
        newDownvotes = downvotes.filter(
          (id: any) => id.toString() !== userId.toString()
        );
      } else {
        // Thêm downvote và bỏ upvote nếu có
        newDownvotes = [...downvotes, userId];
        newUpvotes = upvotes.filter(
          (id: any) => id.toString() !== userId.toString()
        );
      }
    }

    // Cập nhật comment
    comment.upvotes = newUpvotes;
    comment.downvotes = newDownvotes;
    await comment.save();

    // Tạo thông báo nếu vote lần đầu
    try {
      if (voteType === "upvote" && !upvotes.includes(userId)) {
        const notificationService = new NotificationService();
        const post = await ForumPost.findById(comment.postId);
        if (post && (notificationService as any).createCommentLikeNotification) {
          await (notificationService as any).createCommentLikeNotification(
            userId,
            comment,
            post
          );
        }
        // XP service not yet implemented
        // try {
        //   await awardXP(comment.userId, 1, "comment_upvoted", comment._id);
        // } catch (e) {
        //   // Silent fail for XP award
        // }
      }
    } catch {
      // Silent fail for notifications
    }

    const voteScore = newUpvotes.length - newDownvotes.length;

    return {
      success: true,
      upvotes: newUpvotes.length,
      downvotes: newDownvotes.length,
      voteScore,
      userVote: voteType === "upvote" ? "upvoted" : "downvoted",
    };
  }
}
