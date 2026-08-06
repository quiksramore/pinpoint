import { oc } from "@orpc/contract";
import { z } from "zod";
import { profileSchema } from "../profile/profile-schema";
import { contextfulPostSchema, getMapMarkersInputSchema, getMapMarkersOutputSchema, postSchema, uiCreatePostFormSchema } from "./post-schema";

export const postContract = {
  createPost: oc
    .route({
      method: "POST",
      description: "Create a new post",
    })
    .input(uiCreatePostFormSchema)
    .output(
      z.object({
        id: z.uuidv7(),
      })
    )
    .errors({
      FORBIDDEN: {
        // TODO integrate when creating different *types* of posts, as those have restrictions
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
    .input(z.object({ id: postSchema.shape._id }))
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
    }),

  editPost: oc
    .route({
      method: "PUT",
      description: "Edit a post",
    })
    .input(
      z.object({
        id: postSchema.shape._id,
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
  getPostsByProfileId: oc
    .route({
      method: "GET",
      description: "Get a user's posts",
    })
    .input(
      z.object({
        profileId: profileSchema.shape._id,
      })
    )
    .output(z.array(postSchema)),

  getPostById: oc
    .route({
      method: "GET",
      description: "Get a post by ID",
    })
    .input(
      z.object({
        id: postSchema.shape._id,
      })
    )
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

  getMapMarkers: oc
    .route({
      method: "GET",
      description: "Get lightweight map marker previews inside a viewport",
    })
    .input(getMapMarkersInputSchema)
    .output(getMapMarkersOutputSchema)
    .errors({
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
    .output(z.array(contextfulPostSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
