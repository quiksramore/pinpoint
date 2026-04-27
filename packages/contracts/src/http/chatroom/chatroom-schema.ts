import { z } from "zod";
import { messageSchema } from "../../ws/message/message-schema";

export const chatroomSchema = z.object({
  _id: z.uuidv7(),
  createdAt: z.date(),
  type: z.enum(["DIRECT", "GROUP"]),
  title: z.string().optional(), // group-chat title.
  lastMessageSentAt: z.date().optional(),
});

export const chatParticipantSchema = z.object({
  _id: z.uuidv7(),
  chatroomId: z.uuidv7(),
  participantId: z.string(), // better-auth user id
  isVisibleInInbox: z.boolean().default(true),
  joinedAt: z.date(),
  leftAt: z.date().optional(),
});

export const participantPreviewSchema = z.object({
  participantId: z.string(), // better-auth user id
  username: z.string().optional(),
  image: z.string().optional(),
});

export const chatroomPreviewSchema = z.object({
  _id: chatroomSchema.shape._id,
  type: chatroomSchema.shape.type,
  title: chatroomSchema.shape.title,
  participants: z.array(participantPreviewSchema),
  lastMessage: z
    .object({
      _id: messageSchema.shape._id,
      authorId: messageSchema.shape.authorId,
      content: messageSchema.shape.content,
      createdAt: messageSchema.shape.createdAt,
    })
    .optional(),
  // unreadCount: z.number().int().min(0),
});
