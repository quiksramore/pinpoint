import { z } from "zod";

export const singleCommentSchema = z.object({
  comment: z.string().min(1, "Reply must be at least 1 character."),
  author: z.email("Author's email is required."),
});

export const commentsSchema = z.object({
  // biome-ignore format: readability
  rootComment: singleCommentSchema,
  // biome-ignore format: readability
  childReplies: z
    .array(singleCommentSchema)
    .default([]),
});

const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;
export const postSchema = z.object({
  _id: z.uuidv7(),
  // biome-ignore format: readability
  createdBy: z.email("Creator's email is required."),
  // biome-ignore format: readability
  title: z.string().min(1, "Title must be at least 1 character.").max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  description: z
    .string()
    .min(1, "Description must be at least 1 character.")
    .max(DESCRIPTION_MAX_LENGTH, `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  images: z
    .array(z.url())
    .min(1, "At least one image URL is required."),
  // biome-ignore format: readability
  comments: z
    .array(commentsSchema)
    .default([]),
});
