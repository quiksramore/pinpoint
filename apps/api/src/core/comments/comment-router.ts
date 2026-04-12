import { commentLikeSchema, commentSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { PostService } from "../post/post-service";
import { CommentLikeService } from "./comment-like-service";
import { CommentService } from "./comment-service";

export const commentRouter = {
  addComment: protectedProcedure.comment.addComment.handler(async ({ input, context, errors: { INTERNAL_SERVER_ERROR, NOT_FOUND } }) => {
    const id = uuidv7();
    const postDocument = await PostService.findById(input.parentPostId);

    if (!postDocument) {
      throw NOT_FOUND({
        data: { message: `User not found with email: ${context.user.email}` },
      });
    }

    const commentDoc: z.input<typeof commentSchema> = {
      _id: id,
      parentPostId: input.parentPostId,
      authorId: context.user.id,
      authorSnapshot: {
        name: context.user.name,
        image: context.user.image ?? "",
      },
      parentCommentId: input.parentCommentId,
      content: input.content,
      createdAt: new Date(),
    };

    const tryParse = commentSchema.safeParse(commentDoc);

    if (!tryParse.success) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `Invalid Input: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
        },
      });
    }

    try {
      await CommentService.insertOne(commentDoc);
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `Failed to insert document by _id ${id}. ${error}`,
        },
      });
    }

    return id;
  }),
  deleteComment: protectedProcedure.comment.deleteComment.handler(
    async ({ input: commentId, context, errors: { INTERNAL_SERVER_ERROR, NOT_FOUND, FORBIDDEN } }) => {
      const comment = await CommentService.findById(commentId).select({ _id: 1 });

      if (!comment) {
        throw NOT_FOUND({
          data: {
            message: `Comment with id ${commentId} not found.`,
          },
        });
      }

      if (comment.authorId !== context.user.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }

      try {
        const deleteResult = await CommentService.deleteOne({ _id: commentId });
        if (deleteResult.deletedCount === 1) return { success: true };
        return { success: false };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to delete comment with id ${commentId}: ${error}`,
          },
        });
      }
    }
  ),
  likeComment: protectedProcedure.comment.likeComment.handler(
    async ({ input: parentCommentIdInput, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
      const id = uuidv7();
      const comment = await CommentService.findById(parentCommentIdInput).select({ _id: 1 });

      if (!comment) {
        throw NOT_FOUND({
          data: {
            message: "Comment not found",
          },
        });
      }

      const likeDoc: z.input<typeof commentLikeSchema> = {
        _id: id,
        authorId: context.user.id,
        parentCommentId: parentCommentIdInput,
      };

      const tryParse = commentLikeSchema.safeParse(likeDoc);

      if (!tryParse.success) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Invalid Input: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await CommentLikeService.insertOne(likeDoc);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to insert document by _id ${id}. ${error}`,
          },
        });
      }

      return { success: true };
    }
  ),
  unlikeComment: protectedProcedure.comment.unlikeComment.handler(
    async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN } }) => {
      const commentId = await CommentService.findById(input.parentCommentId).select({ _id: 1 });
      const commentLikeId = await CommentLikeService.findById(input.commentLikeId).select({ _id: 1 });

      if (!commentId) {
        throw NOT_FOUND({
          data: {
            message: `Comment with id ${input.parentCommentId} not found.`,
          },
        });
      }

      if (!commentLikeId) {
        throw NOT_FOUND({
          data: {
            message: `Like with id ${input.commentLikeId} not found on comment with id ${input.parentCommentId}.`,
          },
        });
      }

      if (commentLikeId.authorId !== context.user.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }
      try {
        const deleteResult = await CommentLikeService.deleteOne({ _id: commentLikeId });
        if (deleteResult.deletedCount === 1) return { success: true };
        return { success: false };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to delete comment like with id ${commentId}: ${error}`,
          },
        });
      }
    }
  ),
};
