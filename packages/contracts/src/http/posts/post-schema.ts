import z from "zod";
import { voteSchema } from "../vote/vote-schema";

export const TITLE_MAX_LENGTH = 30;
export const CAPTION_MAX_LENGTH = 500;
export const MAX_IMAGES = 5;

export const pointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180), // longitude (x)
    z.number().min(-90).max(90), // latitude (y)
  ]),
});

export const postSchema = z.object({
  _id: z.uuidv7(),
  // biome-ignore format: readability
  authorId: z.string(), // better-auth user id
  // biome-ignore format: readability
  authorSnapshot: z.object({
    name: z.string(),
    image: z.string(),
  }),
  title: z.string().min(1, "A title is required.").max(TITLE_MAX_LENGTH, `Title must be ${TITLE_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  caption: z
    .string()
    .min(1, "A caption is required.")
    .max(CAPTION_MAX_LENGTH, `Caption must be ${CAPTION_MAX_LENGTH} characters or less.`),
  // biome-ignore format: readability
  images: z
    .array(z.object({ suburl: z.string(), location: pointSchema })) // R2 image URLs + location
    .min(1, "At least one image is required."),
  // biome-ignore format: readability
  location: pointSchema, // centre
  metrics: z.object({
    upvotes: z.number().nonnegative().int().default(0),
    downvotes: z.number().nonnegative().int().default(0),
    comments: z.number().nonnegative().int().default(0),
  }),
  // frameType: frameType.default("DEFAULT"),
  // customFrameEnabled: z.boolean().default(true),
  editedAt: z.date().optional(),
  createdAt: z.coerce.date(),
});

export const contextfulPostSchema = postSchema.extend({
  vote: voteSchema.shape.voteValue.optional(),
});

export const uiCreatePostFormSchema = postSchema
  .pick({
    title: true,
    caption: true,
  })
  .extend({
    images: z.array(z.file()).min(1, "At least one image is required.").max(MAX_IMAGES, `Maximum of ${MAX_IMAGES} images allowed.`),
  });
