import { commentLikeSchema, commentSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { PostService } from "../post/post-service";
import { CommentLikeService } from "./comment-like-service";
import { CommentService } from "./comment-service";

export const commentRouter = {
  addComment: protectedProcedure.comment.addComment.handler(async ({ input, context, errors: { INTERNAL_SERVER_ERROR, NOT_FOUND } }) => {
    const postDocument = await PostService.findById(input.parentPostId);
    if (!postDocument) {
      throw NOT_FOUND({
        data: { message: `Post with id ${input.parentPostId} not found.` },
      });
    }

    const id = uuidv7();
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
          message: `Failed to conform: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
        },
      });
    }

    try {
      await CommentService.insertOne(commentDoc);
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `DB failed to insert comment with id ${id}: ${error}`,
        },
      });
    }

    return { id };
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

      const post = await PostService.findById(comment.parentPostId).select({ _id: 1 });
      if (!post) {
        throw NOT_FOUND({
          data: {
            message: `Post with id ${comment.parentPostId} not found.`,
          },
        });
      }

      if (comment.authorId !== context.user.id || post.authorId !== context.user.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }

      try {
        const deleteResult = await CommentService.deleteOne({ _id: commentId });
        return { success: deleteResult.deletedCount === 1 };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to delete comment with id ${commentId}: ${error}`,
          },
        });
      }
    }
  ),

  addLike: protectedProcedure.comment.addLike.handler(async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
    const id = uuidv7();
    const comment = await CommentService.findById(input.id).lean();

    if (!comment) {
      throw NOT_FOUND({
        data: {
          message: `Comment with id ${input.id} not found.`,
        },
      });
    }

    const likeDoc: z.input<typeof commentLikeSchema> = {
      _id: id,
      authorId: context.user.id,
      commentId: input.id,
    };

    const tryParse = commentLikeSchema.safeParse(likeDoc);

    if (!tryParse.success) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `Failed to conform: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
        },
      });
    }

    try {
      await CommentLikeService.insertOne(likeDoc);
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `DB failed to insert comment like with id ${id}. ${error}`,
        },
      });
    }

    return { success: true };
  }),

  removeLike: protectedProcedure.comment.removeLike.handler(async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
    const commentDocument = await CommentService.findById(input.id).lean();

    if (!commentDocument) {
      throw NOT_FOUND({
        data: {
          message: `Comment with id ${input.id} not found.`,
        },
      });
    }

    try {
      await CommentLikeService.deleteOne({
        commentId: input.id,
        authorId: context.user.id,
      });

      return { success: true };
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `DB failed to delete comment like for comment ${input.id}: ${error}`,
        },
      });
    }
  }),
};
