import { oc } from "@orpc/contract";
import { z } from "zod";
import { commentLikeSchema, commentSchema } from "./comment-schema";

export const commentContract = {
  addComment: oc
    .route({
      method: "DELETE",
      description: "Delete a comment",
    })
    .input(
      commentSchema.pick({
        parentPostId: true,
        content: true,
        parentCommentId: true,
      })
    )
    .output(commentSchema.shape._id)
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNAUTHORIZED: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
  deleteComment: oc
    .route({
      method: "DELETE",
      description: "Delete a comment",
    })
    .input(commentSchema.shape._id)
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNAUTHORIZED: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
  likeComment: oc
    .route({
      method: "POST",
      description: "Like a comment",
    })
    .input(commentSchema.shape._id)
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNAUTHORIZED: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
  unlikeComment: oc
    .route({
      method: "DELETE",
      description: "Unliked a comment",
    })
    .input(
      z.object({
        commentLikeId: commentLikeSchema.shape._id,
        parentCommentId: commentLikeSchema.shape.parentCommentId,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNAUTHORIZED: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
