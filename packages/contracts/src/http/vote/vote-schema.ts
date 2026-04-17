import { z } from "zod";

export const voteSchema = z.object({
  _id: z.uuidv7(),
  postId: z.uuidv7(),
  authorId: z.string(), // better-auth user id: TODO rename from authorId (confusing)
  voteValue: z.enum(["UPVOTE", "DOWNVOTE"]),
  createdAt: z.coerce.date(),
});
