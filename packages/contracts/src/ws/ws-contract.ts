import { eventIterator, oc } from "@orpc/contract";
import { z } from "zod";
import { chatroomSchema } from "../http/chatroom/chatroom-schema";
import { messageSchema } from "./message/message-schema";

export const webSocketContract = {
  publishChatMessage: oc
    .input(
      z.object({
        chatroomId: messageSchema.shape.chatroomId,
        message: messageSchema.shape.content,
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
    }),

  subscribeChatRoom: oc
    .input(
      z.object({
        id: chatroomSchema.shape._id,
      })
    )
    .output(
      eventIterator(
        z.object({
          incomingMessage: messageSchema,
        })
      )
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
    }),
};
