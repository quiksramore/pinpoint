import { oc } from "@orpc/contract";
import { z } from "zod";
import { profileSchema } from "../profile/profile-schema";
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
};
