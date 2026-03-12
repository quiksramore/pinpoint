import { z } from "zod";

export const socialSchemas = z.object({
  _id: z.uuidv7(),
  followerUserId: z.uuidv7(),
  followeeUserId: z.uuidv7(),
  createdAt: z.coerce.date(),
});
// { followerUserId: 1, followeeUserId: 1 }

// export const blockedSchema = z.object({
//   _id: z.uuidv7(),
//   blockerId: z.uuidv7(),
//   blockedId: z.uuidv7(),
// });
