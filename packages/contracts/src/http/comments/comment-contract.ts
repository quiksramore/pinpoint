import { oc } from "@orpc/contract";
import { z } from "zod";
import { voteSchema } from "../vote/vote-schema";
import { commentSchema } from "./comment-schema";

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
  addVote: oc
    .route({
      method: "POST",
      description: "Add a vote",
    })
    .input(
      voteSchema.pick({
        postId: true,
        authorId: true,
        voteValue: true,
      })
    )
    .output(voteSchema.shape._id)
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
  removeVote: oc
    .route({
      method: "DELETE",
      description: "Remove your vote",
    })
    .input(voteSchema.shape._id)
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
};
