import { oc } from "@orpc/contract";
import { z } from "zod";
import { postSchema } from "./post-contract";
import { userSchema } from "./user-contract";

const NAME_MAX_LENGTH = 30;
const MEMBER_DEFAULT = 20;
export const UNVERIFIED_MEMBER_LIMIT_MAX = 200;
const DESCRIPTION_MAX_LENGTH = 500;

export const permissionNode = z.enum([
  "UPLOAD_POSTS",
  "DELETE_POSTS",
  "KICK_MEMBER",
  "MANAGE_BANS",
  "MANAGE_INVITES",
  "MANAGE_COMMUNITY_SETTINGS",
  "COMMUNITY_ADMIN", // <- PRIVILEGED
]);

export const invitationSchema = z.object({
  inviter: userSchema.shape._id,
  invitedAt: z.date(),

  invitee: userSchema.shape._id,
  acceptedAt: z.date().nullable(),
});

export const requestInvitationSchema = z.object({
  requester: userSchema.shape._id,
  requestedAt: z.date(),

  approvedBy: userSchema.shape._id.nullable(),
  approvedAt: z.date().nullable(),
});

export const communitySchema = z.object({
  _id: z.uuidv7(),
  private: z.boolean(),
  name: z.string().min(1, "Name must be at least 1 character.").max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or less.`),
  description: z
    .string()
    .min(1, "Description must be at least 1 character.")
    .max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less.`),
  creator: userSchema.shape._id,
  members: z
    .array(
      z.object({
        _id: userSchema.shape._id,
        permissions: z.array(permissionNode),
      })
    )
    .default([]),
  posts: z.array(
    z.object({
      _id: postSchema.shape._id,
    })
  ),
  memberLimit: z.number().default(MEMBER_DEFAULT),
  followers: z.array(userSchema.shape._id).default([]),
  invitations: z.array(invitationSchema).default([]),
  requests: z.array(requestInvitationSchema).default([]),
  bannedMembers: z.array(userSchema.shape._id).default([]),
  verified: z.boolean().default(false),
});

export const communityContract = {
  createCommunity: oc
    .route({
      method: "POST",
    })
    .input(communitySchema.pick({ name: true, description: true, private: true }))
    .output(
      z.object({
        _id: communitySchema.shape._id,
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
    }),

  editCommunity: oc
    .route({
      method: "PUT",
    })
    .input(communitySchema.pick({ name: true, description: true, private: true }))
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
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
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
    }),

  deleteCommunity: oc
    .route({
      method: "DELETE",
    })
    .input(communitySchema.shape._id)
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
      UNAUTHORIZED: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  addMember: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        communityId: communitySchema.shape._id,
        memberId: userSchema.shape._id,
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
      UNAUTHORIZED: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  removeMember: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        communityId: communitySchema.shape._id,
        memberId: userSchema.shape._id,
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
          message: z.string()
        }),
      },
      INTERNAL_SERVER_ERROR: {
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

  // sendInvite community asking user        input(community id, invitee id)
  // acceptInvite user approving community   input(community id)

  // sendRequest user asking community       input(community id)
  // acceptRequest community approving user  input(community id, invitee id)

  sendInvite: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        _id: communitySchema.shape._id,
        invitee: userSchema.shape._id,
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
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
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
    }),

  acceptInvite: oc
    .route({
      method: "PUT",
      description: "Accept an invitation to join a community. Invoked by the invitee.",
    })
    .input(
      z.object({
        _id: communitySchema.shape._id,
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
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
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
    }),

  sendRequest: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        _id: communitySchema.shape._id,
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
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
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
    }),

  acceptRequest: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        _id: communitySchema.shape._id,
        requester: userSchema.shape._id,
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
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
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
    }),
};
