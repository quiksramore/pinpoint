import { oc } from "@orpc/contract";
import z from "zod";
import { profileSchema } from "./profile-schema";

export const profileContract = {
  createProfile: oc
    .route({
      method: "POST",
      description: "Create a new user profile",
    })
    .input(
      z.object({
        username: profileSchema.shape.username,
        bio: profileSchema.shape.bio.optional(),
        location: profileSchema.shape.location.optional(),
      })
    )
    .output(z.object({ id: z.string() }))
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

  deleteProfile: oc
    .route({
      method: "DELETE",
      description: "Delete a user's profile",
    })
    .input(
      z.object({
        id: profileSchema.shape._id,
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
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  editProfile: oc
    .route({
      method: "POST",
      description: "Edit a user's profile information",
    })
    .input(
      // TODO: how to input pin information (currently using uuid of pins??)
      z
        .object({
          _id: profileSchema.shape._id,
          username: profileSchema.shape.username.optional(),
          bio: profileSchema.shape.bio.optional(),
          location: profileSchema.shape.location.optional(),
          // pins: profileSchema.shape.pins.optional(),
        })
        .extend({
          pins: z.array(z.uuidv7()).optional(),
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

  getProfileById: oc
    .route({
      method: "GET",
      description: "Get a user's profile information",
    })
    .input(
      z.object({
        id: profileSchema.shape._id,
      })
    )
    .output(profileSchema)
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
