import { oc } from "@orpc/contract";
import z from "zod";
import { postSchema } from "../posts/post-schema";
import { voteSchema } from "./vote-schema";

export const voteContract = {
  addVote: oc
    .route({
      method: "POST",
      description: "Add a vote",
    })
    .input(
      voteSchema.pick({
        postId: true,
        voteValue: true,
      })
    )
    .output(
      z.object({
        id: voteSchema.shape._id,
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
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
  deleteVote: oc
    .route({
      method: "DELETE",
      description: "Delete a vote",
    })
    .input(
      z.object({
        id: voteSchema.shape._id,
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

  getUserVote: oc
    .route({
      method: "GET",
      description: "Get a post by ID",
    })
    .input(
      z.object({
        postId: postSchema.shape._id,
      })
    )
    .output(voteSchema)
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
