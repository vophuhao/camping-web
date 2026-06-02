import { z } from "zod";

// Validator for creating a comment or reply
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung comment không được để trống")
    .max(5000, "Nội dung comment quá dài"),
  parentId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid parent comment ID")
    .optional()
    .nullable(),
});

export const getCommentsByPostSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).default(1)),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(100).default(10)),
});

// Validator for voting on a comment
export const voteCommentSchema = z.object({
  voteType: z.enum(["upvote", "downvote"], {
    errorMap: () => ({ message: "Vote type phải là 'upvote' hoặc 'downvote'" }),
  }),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type GetCommentsByPostInput = z.infer<typeof getCommentsByPostSchema>;
export type VoteCommentInput = z.infer<typeof voteCommentSchema>;
