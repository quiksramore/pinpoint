import { chatroomSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { ProfileService } from "../profile/profile-service";
import { ChatRoomService } from "./chatroom-service";
import { MessageService } from "./messages-service";

export const chatroomRouter = {
  startChatRoom: protectedProcedure.chatroom.startChatRoom.handler(
    async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR, UNPROCESSABLE_CONTENT } }) => {
      const recipientProfileDoc = await ProfileService.findById(input.recipientId);

      if (!recipientProfileDoc) {
        throw NOT_FOUND({
          data: { message: `User with id ${input.recipientId} not found` },
        });
      }

      if (input.recipientId === context.user.id) {
        throw UNPROCESSABLE_CONTENT({
          data: { message: `Cannot initiate chatroom with recipient of same id: ${input.recipientId}` },
        });
      }

      const existingChatroom = await ChatRoomService.findOne({
        $or: [
          {
            activeParticipantsId: {
              $all: [context.user.id, input.recipientId],
            },
          },
          {
            pastParticipantsId: {
              $all: [context.user.id, input.recipientId],
            },
          },
          {
            activeParticipantsId: context.user.id,
            pastParticipantsId: input.recipientId,
          },
          {
            activeParticipantsId: input.recipientId,
            pastParticipantsId: context.user.id,
          },
        ],
      });

      if (existingChatroom) {
        const isPast = existingChatroom.pastParticipantsId.includes(context.user.id);

        if (isPast) {
          const updatedParticipant = await ChatRoomService.updateOne(
            { _id: existingChatroom._id },
            {
              $pull: { pastParticipantsId: context.user.id },
              $addToSet: { activeParticipantsId: context.user.id },
            }
          );
          if (!updatedParticipant.modifiedCount) {
            throw INTERNAL_SERVER_ERROR({
              data: {
                message: "Failed to transfer participant",
              },
            });
          }
        }
        return { id: existingChatroom._id };
      }

      const id = uuidv7();
      const chatroomDoc: z.infer<typeof chatroomSchema> = {
        _id: id,
        activeParticipantsId: [input.recipientId, context.user.id],
        pastParticipantsId: [],
        createdAt: new Date(),
      };

      const tryParse = chatroomSchema.safeParse(chatroomDoc);

      if (!tryParse.success) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to conform: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await ChatRoomService.insertOne(chatroomDoc);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to insert document by _id ${id}. ${error}`,
          },
        });
      }

      return { id };
    }
  ),

  leaveChatRoom: protectedProcedure.chatroom.leaveChatRoom.handler(async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
    const chatroomDoc = await ChatRoomService.findById(input.chatroomId);

    if (!chatroomDoc) {
      throw NOT_FOUND({
        data: {
          message: "Chatroom not found.",
        },
      });
    }
    const inChatroom = chatroomDoc.activeParticipantsId.includes(context.user.id) ?? false;

    if (!inChatroom) {
      throw NOT_FOUND({
        data: {
          message: "Chatroom not found.",
        },
      });
    }

    try {
      const updatedParticipant = await ChatRoomService.updateOne(
        { _id: input.chatroomId },
        {
          $pull: { activeParticipantsId: context.user.id },
          $addToSet: { pastParticipantsId: context.user.id },
        }
      );
      return { success: updatedParticipant.modifiedCount > 0 };
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `DB failed to remove participant with id ${context.user.id}: ${error}`,
        },
      });
    }
  }),

  getChatroom: protectedProcedure.chatroom.getChatroom.handler(async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
    const recipientProfileDoc = await ProfileService.findById(input.recipientId);

    if (!recipientProfileDoc) {
      throw NOT_FOUND({
        data: { message: `User not found with id: ${input.recipientId}` },
      });
    }

    const chatroomDoc = await ChatRoomService.findOne({
      $or: [
        {
          activeParticipantsId: {
            $all: [context.user.id, input.recipientId],
          },
        },
        {
          activeParticipantsId: context.user.id,
          pastParticipantsId: input.recipientId,
        },
        {
          activeParticipantsId: input.recipientId,
          pastParticipantsId: context.user.id,
        },
        {
          pastParticipantsId: {
            $all: [context.user.id, input.recipientId],
          },
        },
      ],
    }).lean();

    if (!chatroomDoc) {
      throw NOT_FOUND({
        data: {
          message: "Chatroom not found.",
        },
      });
    }

    const isActive = chatroomDoc.activeParticipantsId.includes(context.user.id);
    const isPast = chatroomDoc.pastParticipantsId.includes(context.user.id);

    if (isActive) {
      return chatroomDoc;
    }

    if (isPast) {
      const updatedParticipant = await ChatRoomService.updateOne(
        { _id: chatroomDoc._id },
        {
          $pull: { pastParticipantsId: context.user.id },
          $addToSet: { activeParticipantsId: context.user.id },
        }
      );

      if (!updatedParticipant.modifiedCount) {
        throw INTERNAL_SERVER_ERROR({
          data: { message: "Failed to transfer participant" },
        });
      }
    }

    if (isPast || isActive) {
      return chatroomDoc;
    }
    throw NOT_FOUND({
      data: { message: "Chatroom not found." },
    });
  }),

  getChatrooms: protectedProcedure.chatroom.getChatrooms.handler(async ({ context, errors: { INTERNAL_SERVER_ERROR } }) => {
    try {
      return await ChatRoomService.find({
        activeParticipantsId: context.user.id,
      }).lean();
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `Failed to fetch chatrooms for user ${context.user.id}: ${error}`,
        },
      });
    }
  }),

  getMessageHistory: protectedProcedure.chatroom.getMessageHistory.handler(
    async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
      const chatroom = await ChatRoomService.findById(input.chatroomId);

      if (!chatroom) {
        throw NOT_FOUND({
          data: { message: "Chatroom Not Found." },
        });
      }

      if (!chatroom.activeParticipantsId.includes(context.user.id)) {
        throw NOT_FOUND({
          data: { message: "Chatroom Not Found." },
        });
      }

      try {
        return await MessageService.find({
          chatroomId: input.chatroomId,
        })
          .sort({ createdAt: 1 })
          .lean();
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: { message: `DB failed to fetch messages: ${error}` },
        });
      }
    }
  ),
};
