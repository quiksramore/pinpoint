import { v7 as uuidv7 } from "uuid";
import { chatRoomPublisher } from "../core/messaging/chat-subscription-manager";
import { ChatRoomService } from "../core/messaging/chatroom-service";
import { MessageService } from "../core/messaging/messages-service";
import { protectedWebSocketProcedure } from "../libs/orpc-procedures";

export const webSocketRouter = {
  publishChatMessage: protectedWebSocketProcedure.publishChatMessage.handler(
    async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
      const chatroom = await ChatRoomService.findById(input.chatroomId);
      if (!chatroom)
        throw NOT_FOUND({
          data: {
            message: "Chatroom Not Found.",
          },
        });

      if (!chatroom.activeParticipantsId.includes(context.user.id)) {
        throw NOT_FOUND({
          data: {
            message: "Chatroom Not Found.",
          },
        });
      }

      const outgoingMessage = {
        _id: uuidv7(),
        chatroomId: input.chatroomId,
        createdAt: new Date(),
        authorId: context.user.id,
        content: input.message,
      };

      const result = await MessageService.insertOne(outgoingMessage).catch((error) => {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to persist message: ${error}`,
          },
        });
      });

      if (result) {
        await chatRoomPublisher.publish(input.chatroomId, { incomingMessage: outgoingMessage });
        return { outgoingMessage };
      }
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: "Chatroom Not Found.",
        },
      });
    }
  ),

  subscribeChatRoom: protectedWebSocketProcedure.subscribeChatRoom.handler(async function* ({
    input,
    context,
    errors: { NOT_FOUND },
    signal,
    lastEventId,
  }) {
    const chatroom = await ChatRoomService.findById(input.id);

    if (!chatroom)
      throw NOT_FOUND({
        data: {
          message: "Chatroom Not Found.",
        },
      });

    if (!chatroom.activeParticipantsId.includes(context.user.id)) {
      throw NOT_FOUND({
        data: {
          message: "Chatroom Not Found.",
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
