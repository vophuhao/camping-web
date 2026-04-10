import CommentController from "@/controllers/comment.controller";
import { container, TOKENS } from "@/di";
import { authenticate } from "@/middleware";
import type { CommentService } from "@/services/comment.service";
import { Router } from "express";

const commentRoutes = Router();

const commentService = container.resolve<CommentService>(TOKENS.CommentService);
const commentController = new CommentController(commentService);

// Create comment or reply
commentRoutes.post("/post/:postId", authenticate, commentController.createComment);

// Get comments by post (with pagination)
commentRoutes.get("/post/:postId", commentController.getCommentsByPost);

// Vote on comment (upvote/downvote)
commentRoutes.post("/vote/:id", authenticate, commentController.voteComment);

// Delete comment (only author or post author)
commentRoutes.delete("/:id", authenticate, commentController.deleteComment);

export default commentRoutes;
