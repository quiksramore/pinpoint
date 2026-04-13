import { z } from "zod";

export const socialSchemas = z.object({
  _id: z.uuidv7(),
  followerUserId: z.string(), // better-auth user id
  followeeUserId: z.string(), // better-auth user id
  createdAt: z.coerce.date(),
});
// { followerUserId: 1, followeeUserId: 1 }

// export const blockedSchema = z.object({
//   _id: z.uuidv7(),
//   blockerId: z.string(), // better-auth user id
//   blockedId: z.string(), // better-auth user id
// });
