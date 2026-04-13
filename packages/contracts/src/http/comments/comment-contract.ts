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
    .output(
      z.object({
        id: commentSchema.shape._id,
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
    }),

  deleteComment: oc
    .route({
      method: "DELETE",
      description: "Delete a comment",
    })
    .input(
      z.object({
        id: commentSchema.shape._id,
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
    }),

  addLike: oc
    .route({
      method: "POST",
      description: "Add a like to a comment",
    })
    .input(
      z.object({
        id: commentSchema.shape._id,
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
    }),

  removeLike: oc
    .route({
      method: "DELETE",
      description: "Remove a like from a comment",
    })
    .input(
      z.object({
        id: commentLikeSchema.shape._id,
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
    }),
};
