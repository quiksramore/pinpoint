import z from "zod";

export const TITLE_MAX_LENGTH = 30;
export const CAPTION_MAX_LENGTH = 500;

export const pointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const VALID_MIME_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif", "image/dng"] as const;

export const uploadPhotoInput = z.object({
  id: z.uuidv7(),
  file: z.file("Invalid file."),
  mimeType: z.enum(VALID_MIME_TYPES, "Invalid file type."),
});

export const postSchema = z.object({
  _id: z.uuidv7(),
  // biome-ignore format: readability
  authorId: z.uuidv7(),
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
    .array(z.object({ url: z.url(), location: pointSchema })) // R2 image URLs + location
    .min(1, "At least one image URL is required."),
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
