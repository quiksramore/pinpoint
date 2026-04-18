import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 1000;

export const messageSchema = z.object({
  _id: z.uuidv7(),
  chatroomId: z.uuidv7(),
  createdAt: z.coerce.date(),
  authorId: z.string(),
  editedAt: z.coerce.date().optional(),
  content: z.string().max(MESSAGE_MAX_LENGTH).min(1),
});
