import { MemoryPublisher } from "@orpc/experimental-publisher/memory";
import type { chatroomSchema, messageSchema } from "@pinpoint/contracts";
import type { z } from "zod";

type ChatRoomEvents = Record<z.infer<typeof chatroomSchema.shape._id>, { incomingMessage: z.infer<typeof messageSchema> }>;

// TODO refactor and maybe move to Redis to prevent memory leaks
export const chatRoomPublisher = new MemoryPublisher<ChatRoomEvents>({
  resumeRetentionSeconds: 60 * 5, // Keep events for 5 minutes to support reconnection
});
