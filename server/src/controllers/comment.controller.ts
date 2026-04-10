
import { catchErrors } from "@/errors";
import type { CommentService } from "@/services/comment.service";
import { ResponseUtil } from "@/utils";
import { mongoIdSchema } from "@/validators";
import {
  createCommentSchema,
  getCommentsByPostSchema,
  voteCommentSchema,
} from "@/validators";

export default class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * Create comment or reply
   * @route POST /api/posts/:postId/comments
   */
  createComment = catchErrors(async (req, res) => {
    // Parse and validate input
    const postId = req.params.postId || "";
    const input = createCommentSchema.parse(req.body);
    const userId = mongoIdSchema.parse(req.userId);

    // Create comment
    const comment = await this.commentService.createComment(
      postId,
      userId,
      input.content,
      input.parentId
    );

    return ResponseUtil.created(res, comment, "Tạo comment thành công");
  });

  /**
   * Get comments by post with pagination
   * @route GET /api/posts/:postId/comments
   */
  getCommentsByPost = catchErrors(async (req, res) => {
    const postId = req.params.postId || "";
    const input = getCommentsByPostSchema.parse(req.query);

    const result = await this.commentService.getCommentsByPost(postId, input);
    const totalPages = Math.ceil(result.total / result.pageSize);
    const hasNext = result.page < totalPages;
    const hasPrev = result.page > 1;

    return ResponseUtil.paginated(
      res,
      result.comments,
      {
        page: result.page,
        limit: result.pageSize,
        total: result.totalComments,
        totalPages,
        hasNext,
        hasPrev,
      },
      "Lấy danh sách comment thành công"
    );
  });

  /**
   * Delete comment (only author or post author can delete)
   * @route DELETE /api/comments/:id
   */
  deleteComment = catchErrors(async (req, res) => {
    const id = req.params.id || "";
    const userId = mongoIdSchema.parse(req.userId);

    const result = await this.commentService.deleteComment(id, userId);

    return ResponseUtil.success(res, result, "Xóa comment thành công");
  });

  /**
   * Vote comment (upvote/downvote)
   * @route POST /api/comments/:id/vote
   */
  voteComment = catchErrors(async (req, res) => {
    const id = req.params.id || "";
    const input = voteCommentSchema.parse(req.body);
    const userId = mongoIdSchema.parse(req.userId);

    const result = await this.commentService.voteComment(id, userId, input);

    return ResponseUtil.success(res, result, "Bình chọn comment thành công");
  });
}