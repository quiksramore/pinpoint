import { oc } from "@orpc/contract";
import { z } from "zod";
import { communitySchema } from "./community-contract";
import { userSchema } from "./user-contract";

export const singleCommentSchema = z.object({
  comment: z.string().min(1, "Reply must be at least 1 character."),
  authorId: z.string(),
  likes: z.number(),
});

export const commentsSchema = z.object({
  // biome-ignore format: readability
  rootComment: singleCommentSchema,
  // biome-ignore format: readability
  childReplies: z
    .array(singleCommentSchema)
    .default([]),
});

export const frameType = z.enum(["DEFAULT", "CHRISTMAS", "HALLOWEEN", "EASTER"]);

export const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"] as const;

export const uploadPhotoInput = z.object({
  id: z.uuidv7(),
  file: z.file("Invalid file."),
  mimeType: z.enum(VALID_MIME_TYPES, "Invalid file type."),
});

const TITLE_MAX_LENGTH = 30;
const CAPTION_MAX_LENGTH = 500;

export const postSchema = z.object({
  _id: z.uuidv7(),
  // biome-ignore format: readability
  authorId: userSchema.shape._id,
  // biome-ignore format: readability
  authorSnapshot: z.object({
    name: z.string(),
    image: z.string(),
  }),
  title: z.string().min(1, "Title must be at least 1 character.").max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  caption: z
    .string()
    .min(1, "Caption must be at least 1 character.")
    .max(CAPTION_MAX_LENGTH, `Caption must be ${CAPTION_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  images: z
    .array(z.url())
    .min(1, "At least one image URL is required."),
  // biome-ignore format: readability
  location: z.object({
    longitude: z.number(),
    latitude: z.number(),
  }),
  // biome-ignore format: readability
  votes: z.object({
    upVote: z.number().default(0),
    downVote: z.number().default(0)
    }),
  frameType: frameType.default("DEFAULT"),
  customFrameEnabled: z.boolean().default(true),
  editedAt: z.date().optional(),
  // biome-ignore format: readability
  comments: z
    .array(commentsSchema)
    .default([]),
});
