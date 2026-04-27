import { oc } from "@orpc/contract";
import z from "zod";
import { messageSchema } from "../../ws/message/message-schema";
import { chatroomPreviewSchema, chatroomSchema } from "./chatroom-schema";

export const chatroomContract = {
  createDirectChat: oc
    .route({
      method: "POST",
      description: "Create or return the direct-message chatroom between the current user and another user.",
    })
    .input(
      z.object({
        recipientId: z.string(),
      })
    )
    .output(
      z.object({
        id: chatroomSchema.shape._id,
        created: z.boolean(), // true if newly created, false if existing DM reused
      })
    )
    .errors({
      NOT_FOUND: { data: z.object({ message: z.string() }) },
      UNPROCESSABLE_CONTENT: { data: z.object({ message: z.string() }) },
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),

  createGroupChat: oc
    .route({
      method: "POST",
      description: "Create a new group chat.",
    })
    .input(
      z.object({
        title: z.string().trim().min(1),
        participantIds: z.array(z.string()).min(1),
      })
    )
    .output(
      z.object({
        id: chatroomSchema.shape._id,
      })
    )
    .errors({
      NOT_FOUND: { data: z.object({ message: z.string() }) },
      UNPROCESSABLE_CONTENT: { data: z.object({ message: z.string() }) },
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),

  getChatroomById: oc
    .route({
      method: "GET",
      description: "Get a chatroom and its participants by chatroom id.",
    })
    .input(
      z.object({
        id: chatroomSchema.shape._id,
      })
    )
    .output(chatroomSchema)
    .errors({
      NOT_FOUND: { data: z.object({ message: z.string() }) },
      FORBIDDEN: { data: z.object({ message: z.string() }) },
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),

  getChatrooms: oc
    .route({
      method: "GET",
      description: "Get all visible chatrooms for the current user's inbox.",
    })
    .output(z.array(chatroomPreviewSchema))
    .errors({
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),

  hideDirectChatroomFromInbox: oc
    .route({
      method: "PUT",
      description: "Hide a chatroom from the current user's inbox.",
    })
    .input(
      z.object({
        id: chatroomSchema.shape._id,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .errors({
      NOT_FOUND: { data: z.object({ message: z.string() }) },
      FORBIDDEN: { data: z.object({ message: z.string() }) },
      UNPROCESSABLE_CONTENT: { data: z.object({ message: z.string() }) },
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),

  leaveGroupChat: oc
    .route({
      method: "PUT",
      description: "Leave a group chat.",
    })
    .input(
      z.object({
        id: chatroomSchema.shape._id,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .errors({
      NOT_FOUND: { data: z.object({ message: z.string() }) },
      FORBIDDEN: { data: z.object({ message: z.string() }) },
      UNPROCESSABLE_CONTENT: { data: z.object({ message: z.string() }) },
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),

  // TODO add `removeGroupParticipants` route, which means chatRoom needs to have a createdBy field, and toggle lettings other ppl kick
  addGroupParticipants: oc
    .route({
      method: "POST",
      description: "Add participants to an existing group chat.",
    })
    .input(
      z.object({
        chatroomId: chatroomSchema.shape._id,
        participantIds: z.array(z.string()).min(1),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .errors({
      NOT_FOUND: { data: z.object({ message: z.string() }) },
      FORBIDDEN: { data: z.object({ message: z.string() }) },
      UNPROCESSABLE_CONTENT: { data: z.object({ message: z.string() }) },
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),

  getMessageHistory: oc
    .route({
      method: "GET",
      description: "Get messages for a chatroom.",
    })
    .input(
      z.object({
        chatroomId: chatroomSchema.shape._id,
      })
    )
    .output(
      z.object({
        messages: z.array(messageSchema),
      })
    )
    .errors({
      NOT_FOUND: { data: z.object({ message: z.string() }) },
      FORBIDDEN: { data: z.object({ message: z.string() }) },
      INTERNAL_SERVER_ERROR: { data: z.object({ message: z.string() }) },
    }),
};
