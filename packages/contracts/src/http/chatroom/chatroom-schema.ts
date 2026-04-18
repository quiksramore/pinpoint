import { z } from "zod";

export const chatroomSchema = z.object({
  _id: z.uuidv7(),
  activeParticipantsId: z.array(z.string()),
  pastParticipantsId: z.array(z.string()).default([]),
  createdAt: z.date(),
});

// TODO when refactoring for group chats, create separate collection called chat_participants:
// _id: chatroom_id,
// participant_id: string,
// visible: boolean,
// each document represents a participant in a chatroom, with a boolean flag indicating if they are currently visible in the chatroom.
