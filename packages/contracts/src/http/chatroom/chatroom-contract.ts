import { oc } from "@orpc/contract";
import { z } from "zod";
import { messageSchema } from "../../ws/message/message-schema";
import { profileSchema } from "../profile/profile-schema";
import { chatroomSchema } from "./chatroom-schema";

// TODO refactor to implement groups
export const chatroomContract = {
  startChatRoom: oc
    .route({
      method: "POST",
      description: "Creates a chatroom for messaging",
    })
    .input(
      z.object({
        recipientId: z.string(),
      })
    )
    .output(
      z.object({
        id: z.uuidv7(),
      })
    )
    .errors({
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
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  leaveChatRoom: oc
    .route({
      method: "PUT",
      description: "Removes a participant from chatroom",
    })
    .input(
      z.object({
        chatroomId: chatroomSchema.shape._id,
      })
    )
    .output(
      z.object({
        success: z.boolean(),
        error: z.string().optional(),
      })
    )
    .errors({
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
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getChatroom: oc
    .route({
      method: "GET",
      description: "Get chatroom",
    })
    .input(
      z.object({
        recipientId: profileSchema.shape._id,
      })
    )
    .output(chatroomSchema)
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

  getChatrooms: oc
    .route({
      method: "GET",
      description: "Get all active chatrooms for current user",
    })
    .output(z.array(chatroomSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getMessageHistory: oc
    .route({
      method: "GET",
      description: "Get messages for a chatroom",
    })
    .input(
      z.object({
        chatroomId: chatroomSchema.shape._id,
      })
    )
    .output(z.array(messageSchema))
    .errors({
      NOT_FOUND: {
        data: z.object({ message: z.string() }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({ message: z.string() }),
      },
    }),
};
