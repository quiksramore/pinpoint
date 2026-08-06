import z from "zod";
import { voteSchema } from "../vote/vote-schema";

export const TITLE_MAX_LENGTH = 30;
export const CAPTION_MAX_LENGTH = 500;
export const MAX_IMAGES = 5;
export const DEFAULT_MAP_MARKER_LIMIT = 500;
export const MAX_MAP_MARKER_LIMIT = 1000;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;
export const LONGITUDE_RANGE = 360;
export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const MAP_MAX_ZOOM = 24;

export const pointSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(LONGITUDE_MIN).max(LONGITUDE_MAX), // longitude (x)
    z.number().min(LATITUDE_MIN).max(LATITUDE_MAX), // latitude (y)
  ]),
});

export const postSchema = z.strictObject({
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

export const mapBoundsSchema = z
  .strictObject({
    west: z.coerce.number().min(LONGITUDE_MIN).max(LONGITUDE_MAX),
    south: z.coerce.number().min(LATITUDE_MIN).max(LATITUDE_MAX),
    east: z.coerce.number().min(LONGITUDE_MIN).max(LONGITUDE_MAX),
    north: z.coerce.number().min(LATITUDE_MIN).max(LATITUDE_MAX),
  })
  .refine((bounds) => bounds.south < bounds.north, {
    message: "South bound must be less than north bound.",
    path: ["south"],
  });

export const mapMarkerSchema = z.strictObject({
  postId: postSchema.shape._id,
  location: pointSchema,
  thumbnailSuburl: z.string(),
  title: postSchema.shape.title,
});

export const getMapMarkersInputSchema = z.strictObject({
  bounds: mapBoundsSchema,
  zoom: z.coerce.number().min(0).max(MAP_MAX_ZOOM),
  limit: z.coerce.number().int().positive().max(MAX_MAP_MARKER_LIMIT).default(DEFAULT_MAP_MARKER_LIMIT),
});

export const getMapMarkersOutputSchema = z.strictObject({
  markers: z.array(mapMarkerSchema),
  hasMore: z.boolean(),
});

export const uiCreatePostFormSchema = postSchema
  .pick({
    title: true,
    caption: true,
  })
  .extend({
    images: z.array(z.file()).min(1, "At least one image is required.").max(MAX_IMAGES, `Maximum of ${MAX_IMAGES} images allowed.`),
  });
