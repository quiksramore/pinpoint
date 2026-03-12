import { z } from "zod";

export const voteSchema = z.object({
  _id: z.uuidv7(),
  postId: z.uuidv7(),
  authorId: z.uuidv7(), // author who voted
  voteValue: z.literal(1).or(z.literal(-1)),
  createdAt: z.coerce.date(),
});
