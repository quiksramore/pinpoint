import { oc } from "@orpc/contract";
import { z } from "zod";
import { profileSchema } from "../profile/profile-schema";
import { voteSchema } from "../vote/vote-schema";
import { postSchema, uiCreatePostFormSchema } from "./post-schema";

export const postContract = {
  createPost: oc
    .route({
      method: "POST",
      description: "Create a new post",
    })
    .input(uiCreatePostFormSchema)
    .output(
      z.object({
        _id: z.uuidv7(),
      })
    )
    .errors({
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  deletePost: oc
    .route({
      method: "DELETE",
      description: "Delete a post",
    })
    .input(postSchema.shape._id)
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .errors({
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
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
    }),

  editPost: oc
    .route({
      method: "PUT",
      description: "Edit a post",
    })
    .input(
      z.object({
        _id: postSchema.shape._id,
        title: postSchema.shape.title.optional(),
        caption: postSchema.shape.caption.optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .errors({
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
  getPosts: oc
    .route({
      method: "GET",
      description: "Get a user's posts",
    })
    .input(profileSchema.shape._id)
    .output(z.array(postSchema))
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
    }),
  getPostById: oc
    .route({
      method: "GET",
      description: "Get a post by ID",
    })
    .input(postSchema.shape._id)
    .output(postSchema)
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
    }),
  // TODO: DELETE IN PRODUCTION, ENDPOINT JUST FOR MVP
  getAllPosts: oc
    .route({
      method: "GET",
      description: "Get all posts (for MVP only)",
    })
    .output(z.array(postSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
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
    .output(
      z.object({
        _id: voteSchema.shape._id,
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
  deleteVote: oc
    .route({
      method: "DELETE",
      description: "Delete a vote",
    })
    .input(
      z.object({
        _id: voteSchema.shape._id,
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
