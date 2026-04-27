import { chatParticipantSchema, chatroomPreviewSchema, chatroomSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { ProfileService } from "../profile/profile-service";
import { ChatParticipantService } from "./chat-participant-service";
import { ChatRoomService } from "./chatroom-service";
import { MessageService } from "./messages-service";

export const chatroomRouter = {
  createDirectChat: protectedProcedure.chatroom.createDirectChat.handler(
    async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR, UNPROCESSABLE_CONTENT } }) => {
      if (input.recipientId === context.user.id) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: `Cannot create a direct chat with yourself: ${input.recipientId}`,
          },
        });
      }

      const recipientProfileDoc = await ProfileService.findById(input.recipientId);

      if (!recipientProfileDoc) {
        throw NOT_FOUND({
          data: {
            message: `User with id ${input.recipientId} not found`,
          },
        });
      }

      const currentUserParticipantDocs = await ChatParticipantService.find({
        participantId: context.user.id,
        leftAt: { $exists: false },
      }).lean();

      const currentUserChatroomIds = currentUserParticipantDocs.map((doc) => doc.chatroomId);

      const existingDirectChatrooms = await ChatRoomService.find({
        _id: { $in: currentUserChatroomIds },
        type: "DIRECT",
      }).lean();

      let existingChatroom: z.infer<typeof chatroomSchema> | null = null;

      for (const chatroom of existingDirectChatrooms) {
        const participants = await ChatParticipantService.find({
          chatroomId: chatroom._id,
          leftAt: { $exists: false },
        }).lean();

        if (
          participants.length === 2 &&
          participants.some((participant) => participant.participantId === context.user.id) &&
          participants.some((participant) => participant.participantId === input.recipientId)
        ) {
          existingChatroom = chatroom;
          break;
        }
      }

      if (existingChatroom) {
        const existingMembership = await ChatParticipantService.findOne({
          chatroomId: existingChatroom._id,
          participantId: context.user.id,
        });

        if (!existingMembership) {
          throw INTERNAL_SERVER_ERROR({
            data: {
              message: `Membership missing for user ${context.user.id} in chatroom ${existingChatroom._id}`,
            },
          });
        }

        if (!existingMembership.isVisibleInInbox) {
          const updatedMembership = await ChatParticipantService.updateOne(
            { _id: existingMembership._id },
            {
              $set: {
                isVisibleInInbox: true,
              },
            }
          );

          if (!updatedMembership.modifiedCount) {
            throw INTERNAL_SERVER_ERROR({
              data: {
                message: `Failed to re-show direct chatroom ${existingChatroom._id} in inbox`,
              },
            });
          }
        }

        return {
          id: existingChatroom._id,
          created: false,
        };
      }

      const chatroomId = uuidv7();
      const now = new Date();

      const chatroomDoc: z.infer<typeof chatroomSchema> = {
        _id: chatroomId,
        createdAt: now,
        type: "DIRECT",
      };

      const currentUserParticipantDoc: z.infer<typeof chatParticipantSchema> = {
        _id: uuidv7(),
        chatroomId,
        participantId: context.user.id,
        isVisibleInInbox: true,
        joinedAt: now,
      };

      const recipientParticipantDoc: z.infer<typeof chatParticipantSchema> = {
        _id: uuidv7(),
        chatroomId,
        participantId: input.recipientId,
        isVisibleInInbox: true,
        joinedAt: now,
      };

      const parsedChatroom = chatroomSchema.safeParse(chatroomDoc);
      const parsedCurrentUserParticipant = chatParticipantSchema.safeParse(currentUserParticipantDoc);
      const parsedRecipientParticipant = chatParticipantSchema.safeParse(recipientParticipantDoc);

      if (!parsedChatroom.success || !parsedCurrentUserParticipant.success || !parsedRecipientParticipant.success) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: "Failed to conform to chatroom or participant schema",
          },
        });
      }

      try {
        await ChatRoomService.insertOne(chatroomDoc);
        await ChatParticipantService.insertMany([currentUserParticipantDoc, recipientParticipantDoc]);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to create direct chatroom ${chatroomId}: ${error}`,
          },
        });
      }

      return {
        id: chatroomId,
        created: true,
      };
    }
  ),

  createGroupChat: protectedProcedure.chatroom.createGroupChat.handler(
    async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR, UNPROCESSABLE_CONTENT } }) => {
      const uniqueOtherParticipantIds = [...new Set(input.participantIds)];

      if (uniqueOtherParticipantIds.length === 0) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "A group chat must include at least one other participant.",
          },
        });
      }

      if (uniqueOtherParticipantIds.includes(context.user.id)) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "participantIds should only contain other participants. Do not include the current user.",
          },
        });
      }

      const participantProfiles = await ProfileService.find({
        _id: { $in: uniqueOtherParticipantIds },
      }).lean();

      if (participantProfiles.length !== uniqueOtherParticipantIds.length) {
        const foundIds = new Set(participantProfiles.map((profile) => profile._id.toString()));
        const missingIds = uniqueOtherParticipantIds.filter((id) => !foundIds.has(id));

        throw NOT_FOUND({
          data: {
            message: `Some participants were not found: ${missingIds.join(", ")}`,
          },
        });
      }

      const chatroomId = uuidv7();
      const now = new Date();

      const chatroomDoc: z.infer<typeof chatroomSchema> = {
        _id: chatroomId,
        createdAt: now,
        type: "GROUP",
        title: input.title,
      };

      const participantDocs: z.infer<typeof chatParticipantSchema>[] = [context.user.id, ...uniqueOtherParticipantIds].map((participantId) => ({
        _id: uuidv7(),
        chatroomId,
        participantId,
        isVisibleInInbox: true,
        joinedAt: now,
      }));

      const parsedChatroom = chatroomSchema.safeParse(chatroomDoc);
      const parsedParticipants = participantDocs.map((doc) => chatParticipantSchema.safeParse(doc));

      if (!parsedChatroom.success || parsedParticipants.some((result) => !result.success)) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: "Failed to conform to chatroom or participant schema",
          },
        });
      }

      try {
        await ChatRoomService.insertOne(chatroomDoc);
        await ChatParticipantService.insertMany(participantDocs);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to create group chatroom ${chatroomId}: ${error}`,
          },
        });
      }

      return {
        id: chatroomId,
      };
    }
  ),

  getChatroomById: protectedProcedure.chatroom.getChatroomById.handler(
    async ({ input, context, errors: { NOT_FOUND, FORBIDDEN, INTERNAL_SERVER_ERROR } }) => {
      const chatroomDoc = await ChatRoomService.findById(input.id).lean();

      if (!chatroomDoc) {
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

      const parsedChatroom = chatroomSchema.safeParse(chatroomDoc);

      if (!parsedChatroom.success) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to conform: ${parsedChatroom.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      return chatroomDoc;
    }
  ),

  getChatrooms: protectedProcedure.chatroom.getChatrooms.handler(async ({ context, errors: { INTERNAL_SERVER_ERROR } }) => {
    try {
      const visibleMemberships = await ChatParticipantService.find({
        participantId: context.user.id,
        isVisibleInInbox: true,
        leftAt: { $exists: false },
      }).lean();

      if (visibleMemberships.length === 0) {
        return [];
      }

      const chatroomIds = visibleMemberships.map((membership) => membership.chatroomId);

      const chatrooms = await ChatRoomService.find({
        _id: { $in: chatroomIds },
      })
        .sort({ lastMessageSentAt: -1, createdAt: -1 })
        .lean();

      const previews: z.infer<typeof chatroomPreviewSchema>[] = [];

      for (const chatroom of chatrooms) {
        const memberships = await ChatParticipantService.find({
          chatroomId: chatroom._id,
          leftAt: { $exists: false },
        }).lean();

        const otherMemberships =
          chatroom.type === "DIRECT" ? memberships.filter((membership) => membership.participantId !== context.user.id) : memberships;

        const participantIds = otherMemberships.map((membership) => membership.participantId);

        const participantProfiles = participantIds.length
          ? await ProfileService.find({
              _id: { $in: participantIds },
            }).lean()
          : [];

        const participants = otherMemberships.map((membership) => {
          const profile = participantProfiles.find((participantProfile) => participantProfile._id.toString() === membership.participantId);

          return {
            participantId: membership.participantId,
            username: profile?.username,
            image: "",
          };
        });

        const lastMessage = await MessageService.findOne({
          chatroomId: chatroom._id,
        })
          .sort({ createdAt: -1 })
          .lean();

        const preview: z.infer<typeof chatroomPreviewSchema> = {
          _id: chatroom._id,
          type: chatroom.type,
          title: chatroom.title,
          participants,
          lastMessage: lastMessage
            ? {
                _id: lastMessage._id,
                authorId: lastMessage.authorId,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
              }
            : undefined,
        };

        const parsedPreview = chatroomPreviewSchema.safeParse(preview);
        if (!parsedPreview.success) {
          throw INTERNAL_SERVER_ERROR({
            data: {
              message: `Failed to conform preview for chatroom ${chatroom._id}: ${parsedPreview.error.issues
                .map((issue) => issue.message)
                .join(", ")}`,
            },
          });
        }

        previews.push(preview);
      }

      return previews;
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `Failed to fetch chatrooms for user ${context.user.id}: ${error}`,
        },
      });
    }
  }),

  hideDirectChatroomFromInbox: protectedProcedure.chatroom.hideDirectChatroomFromInbox.handler(
    async ({ input, context, errors: { NOT_FOUND, FORBIDDEN, UNPROCESSABLE_CONTENT, INTERNAL_SERVER_ERROR } }) => {
      const chatroomDoc = await ChatRoomService.findById(input.id).lean();

      if (!chatroomDoc) {
        throw NOT_FOUND({
          data: {
            message: "Chatroom not found.",
          },
        });
      }

      if (chatroomDoc.type !== "DIRECT") {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "hideDirectChatroomFromInbox only supports direct chatrooms.",
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
            message: "You are not a participant in this direct chatroom.",
          },
        });
      }

      try {
        const updatedMembership = await ChatParticipantService.updateOne(
          { _id: membership._id },
          {
            $set: {
              isVisibleInInbox: false,
            },
          }
        );

        return {
          success: updatedMembership.modifiedCount > 0,
        };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to hide direct chatroom ${input.id} for user ${context.user.id}: ${error}`,
          },
        });
      }
    }
  ),

  leaveGroupChat: protectedProcedure.chatroom.leaveGroupChat.handler(
    async ({ input, context, errors: { NOT_FOUND, FORBIDDEN, UNPROCESSABLE_CONTENT, INTERNAL_SERVER_ERROR } }) => {
      const chatroomDoc = await ChatRoomService.findById(input.id).lean();

      if (!chatroomDoc) {
        throw NOT_FOUND({
          data: {
            message: "Chatroom not found.",
          },
        });
      }

      if (chatroomDoc.type !== "GROUP") {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "leaveGroupChat only supports group chatrooms.",
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
            message: "You are not a participant in this group chatroom.",
          },
        });
      }

      try {
        const updatedMembership = await ChatParticipantService.updateOne(
          { _id: membership._id },
          {
            $set: {
              leftAt: new Date(),
              isVisibleInInbox: false,
            },
          }
        );

        return {
          success: updatedMembership.modifiedCount > 0,
        };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to remove participant ${context.user.id} from group ${input.id}: ${error}`,
          },
        });
      }
    }
  ),

  addGroupParticipants: protectedProcedure.chatroom.addGroupParticipants.handler(
    async ({ input, context, errors: { NOT_FOUND, FORBIDDEN, UNPROCESSABLE_CONTENT, INTERNAL_SERVER_ERROR } }) => {
      const chatroomDoc = await ChatRoomService.findById(input.chatroomId).lean();

      if (!chatroomDoc) {
        throw NOT_FOUND({
          data: {
            message: "Chatroom not found.",
          },
        });
      }

      if (chatroomDoc.type !== "GROUP") {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "addGroupParticipants only supports group chatrooms.",
          },
        });
      }

      const requesterMembership = await ChatParticipantService.findOne({
        chatroomId: input.chatroomId,
        participantId: context.user.id,
        leftAt: { $exists: false },
      }).lean();

      if (!requesterMembership) {
        throw FORBIDDEN({
          data: {
            message: "You are not a participant in this group chatroom.",
          },
        });
      }

      const uniqueParticipantIds = [...new Set(input.participantIds)];

      if (uniqueParticipantIds.length === 0) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "participantIds must contain at least one participant.",
          },
        });
      }

      const participantProfiles = await ProfileService.find({
        _id: { $in: uniqueParticipantIds },
      }).lean();

      if (participantProfiles.length !== uniqueParticipantIds.length) {
        const foundIds = new Set(participantProfiles.map((profile) => profile._id.toString()));
        const missingIds = uniqueParticipantIds.filter((id) => !foundIds.has(id));

        throw NOT_FOUND({
          data: {
            message: `Some participants were not found: ${missingIds.join(", ")}`,
          },
        });
      }

      const existingMemberships = await ChatParticipantService.find({
        chatroomId: input.chatroomId,
        participantId: { $in: uniqueParticipantIds },
      }).lean();

      const existingParticipantIds = new Set(existingMemberships.map((membership) => membership.participantId));
      const participantsToInsert = uniqueParticipantIds.filter((participantId) => !existingParticipantIds.has(participantId));

      if (participantsToInsert.length === 0) {
        return { success: true };
      }

      const now = new Date();

      const participantDocs: z.infer<typeof chatParticipantSchema>[] = participantsToInsert.map((participantId) => ({
        _id: uuidv7(),
        chatroomId: input.chatroomId,
        participantId,
        isVisibleInInbox: true,
        joinedAt: now,
      }));

      const parsedParticipants = participantDocs.map((doc) => chatParticipantSchema.safeParse(doc));

      if (parsedParticipants.some((result) => !result.success)) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: "Failed to conform to participant schema",
          },
        });
      }

      try {
        await ChatParticipantService.insertMany(participantDocs);

        return {
          success: true,
        };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to add participants to group ${input.chatroomId}: ${error}`,
          },
        });
      }
    }
  ),

  getMessageHistory: protectedProcedure.chatroom.getMessageHistory.handler(
    async ({ input, context, errors: { NOT_FOUND, FORBIDDEN, INTERNAL_SERVER_ERROR } }) => {
      const chatroomDoc = await ChatRoomService.findById(input.chatroomId).lean();

      if (!chatroomDoc) {
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

      try {
        return {
          messages: await MessageService.find({
            chatroomId: input.chatroomId,
          })
            .sort({ createdAt: 1 })
            .lean(),
        };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to fetch messages for chatroom ${input.chatroomId}: ${error}`,
          },
        });
      }
    }
  ),
};
