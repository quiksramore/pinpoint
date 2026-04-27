import { messageSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ChatParticipantService } from "../core/messaging/chat-participant-service";
import { chatRoomPublisher } from "../core/messaging/chat-subscription-manager";
import { ChatRoomService } from "../core/messaging/chatroom-service";
import { MessageService } from "../core/messaging/messages-service";
import { protectedWebSocketProcedure } from "../libs/orpc-procedures";

export const webSocketRouter = {
  publishChatMessage: protectedWebSocketProcedure.publishChatMessage.handler(
    async ({ input, context, errors: { NOT_FOUND, FORBIDDEN, INTERNAL_SERVER_ERROR } }) => {
      const chatroom = await ChatRoomService.findById(input.chatroomId).lean();

      if (!chatroom) {
        throw NOT_FOUND({
          data: {
            message: "Chatroom not found.",
          },
        });
      }

      const membership = await ChatParticipantService.findOne({
        chatroomId: input.chatroomId,
        participantId: context.user.id,
        leftAt: { $exists: false },
      }).lean();

      if (!membership) {
        throw FORBIDDEN({
          data: {
            message: "You are not a participant in this chatroom.",
          },
        });
      }

      const now = new Date();

      const outgoingMessage: z.infer<typeof messageSchema> = {
        _id: uuidv7(),
        chatroomId: input.chatroomId,
        createdAt: now,
        authorId: context.user.id,
        content: input.message,
      };

      const parsedMessage = messageSchema.safeParse(outgoingMessage);

      if (!parsedMessage.success) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to conform: ${parsedMessage.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await MessageService.insertOne(outgoingMessage);

        await ChatRoomService.updateOne(
          { _id: input.chatroomId },
          {
            $set: {
              lastMessageSentAt: now,
            },
          }
        );

        await chatRoomPublisher.publish(input.chatroomId, {
          incomingMessage: outgoingMessage,
        });

        return { outgoingMessage };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to publish chat message: ${error}`,
          },
        });
      }
    }
  ),

  subscribeChatRoom: protectedWebSocketProcedure.subscribeChatRoom.handler(async function* ({
    input,
    context,
    errors: { NOT_FOUND, FORBIDDEN },
    signal,
    lastEventId,
  }) {
    const chatroom = await ChatRoomService.findById(input.id).lean();

    if (!chatroom) {
      throw NOT_FOUND({
        data: {
          message: "Chatroom not found.",
        },
      });
    }

    const membership = await ChatParticipantService.findOne({
      chatroomId: input.id,
      participantId: context.user.id,
      leftAt: { $exists: false },
    }).lean();

    if (!membership) {
      throw FORBIDDEN({
        data: {
          message: "You are not a participant in this chatroom.",
        },
      });
    }

    const iterator = chatRoomPublisher.subscribe(input.id, {
      signal,
      lastEventId,
    });

    for await (const payload of iterator) {
      yield payload;
    }
  }),
};
