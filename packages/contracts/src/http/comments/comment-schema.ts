import { z } from "zod";

export const commentSchema = z.object({
  _id: z.uuidv7(),
  parentPostId: z.uuidv7(),
  authorId: z.string(),
  authorSnapshot: z.object(
    {
      name: z.string().min(1, "Author name must be provided."),
      image: z.string().min(1, "Author image URL must be provided."),
    },
    "Author snapshot must be provided."
  ),
  parentCommentId: z.uuidv7().optional(),
  content: z.string().min(1, "Comment must be at least 1 character."),
  likes: z.number().nonnegative().int().default(0),
  createdAt: z.coerce.date(),
});

export const commentLikeSchema = z.object({
  _id: z.uuidv7(),
  authorId: z.string(), // better-auth user id
  commentId: z.uuidv7(),
}); // { commentId: 1, userId: 1 }
