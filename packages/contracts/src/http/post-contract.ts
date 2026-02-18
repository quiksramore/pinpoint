import { oc } from "@orpc/contract";
import { z } from "zod";
import { communityIdType, postIdType } from "../id-types";
import { userSchema } from "./user-contract";

export const singleCommentSchema = z.object({
  comment: z.string().min(1, "Reply must be at least 1 character."),
  authorId: z.string(),
  likes: z.number(),
});

export const commentsSchema = z.object({
  // biome-ignore format: readability
  rootComment: singleCommentSchema,
  // biome-ignore format: readability
  childReplies: z
    .array(singleCommentSchema)
    .default([]),
});

export const frameType = z.enum(["DEFAULT", "CHRISTMAS", "HALLOWEEN", "EASTER"]);

export const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"] as const;

export const uploadPhotoInput = z.object({
  id: z.uuidv7(),
  file: z.file("Invalid file."),
  mimeType: z.enum(VALID_MIME_TYPES, "Invalid file type."),
});

const TITLE_MAX_LENGTH = 30;
const CAPTION_MAX_LENGTH = 500;

export const postSchema = z.object({
  _id: postIdType,
  // biome-ignore format: readability
  authorId: userSchema.shape._id,
  // biome-ignore format: readability
  authorSnapshot: z.object({
    name: z.string(),
    image: z.string(),
  }),
  title: z.string().min(1, "Title must be at least 1 character.").max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  caption: z
    .string()
    .min(1, "Caption must be at least 1 character.")
    .max(CAPTION_MAX_LENGTH, `Caption must be ${CAPTION_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  images: z
    .array(z.url())
    .min(1, "At least one image URL is required."),
  // biome-ignore format: readability
  location: z.object({
    longitude: z.number(),
    latitude: z.number(),
  }),
  // biome-ignore format: readability
  votes: z.object({
    upVote: z.number().default(0),
    downVote: z.number().default(0)
    }),
  frameType: frameType.default("DEFAULT"),
  customFrameEnabled: z.boolean().default(true),
  editedAt: z.date().optional(),
  // biome-ignore format: readability
  comments: z
    .array(commentsSchema)
    .default([]),
});

export const postContract = {
  createPost: oc
    .route({
      method: "POST",
      description: "Create a new post",
    })
    .input(
      postSchema
        .pick({
          title: true,
          caption: true,
          frameType: true,
        })
        .extend({
          images: z.array(uploadPhotoInput.omit({ id: true })),
          community: communityIdType.optional(),
        })
    )
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

  deletePost: oc
    .route({
      method: "DELETE",
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
    })
    .input(
      z.object({
        _id: postSchema.shape._id,
        title: postSchema.shape.title.optional(),
        caption: postSchema.shape.caption.optional(),
        customFrameEnabled: postSchema.shape.customFrameEnabled.optional(),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .errors({
      UNAUTHORIZED: {
        data: z.object({
          message: z.string(),
        }),
      },
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

  getPost: oc
    .route({
      method: "GET",
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

  getPosts: oc
    .route({
      method: "GET",
    })
    .input(postSchema.shape.authorId)
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

  createNewComment: oc
    .route({
      method: "POST",
    })
    .input(
      z.object({
        postId: postSchema.shape._id,
        comment: singleCommentSchema,
      })
    )
    .output(z.object({ success: z.boolean() }))
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

  replyToComment: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        postId: postSchema.shape._id,
        commentIndex: z.coerce.number().min(0),
        reply: z.string().min(1, "Reply must be at least 1 character."),
      })
    )
    .output(z.object({ success: z.boolean() }))
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

  deleteComment: oc
    .route({
      method: "DELETE",
    })
    .input(
      z.object({
        postId: postSchema.shape._id,
        commentIndex: z.coerce.number().int().min(0),
      })
    )
    .output(z.object({ success: z.boolean() }))
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
