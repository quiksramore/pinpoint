import z from "zod";
import { pinTypes } from "../pins-and-points/pins-schema";

export const PIN_DISPLAY_LIMIT = 2;
export const EXTENDED_PIN_DISPLAY_LIMIT = 5;

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

export const BIO_MAX_LENGTH = 200;

// TODO: figure out max character lengths for certain attributes
export const profileSchema = z.object({
  _id: z.string(), // full type unknown, we're using better-auth user _id property.
  createdAt: z.coerce.date(),
  image: z.string().url().optional(),
  username: z
    .string()
    .min(USERNAME_MIN_LENGTH, `Usernames must be at least ${USERNAME_MIN_LENGTH} characters long.`)
    .max(USERNAME_MAX_LENGTH, `Usernames must be at most ${USERNAME_MAX_LENGTH} characters long.`)
    .regex(/^[a-zA-Z0-9_]+$/, "Usernames must be strictly alphanumeric (may contain underscores)"),
  bio: z.string().max(BIO_MAX_LENGTH).optional(),
  followers: z.number().nonnegative().int().default(0),
  following: z.number().nonnegative().int().default(0),
  postCount: z.number().nonnegative().int().default(0),
  location: z.string().optional(),
  pins: z.object({
    displayedPins: z.array(
      z.object({
        name: z.enum(Object.keys(pinTypes)),
        count: z.number().nonnegative().int(),
      })
    ),
    uniquePinCount: z.number().nonnegative().int(),
  }),
  maxDisplayPinCount: z.number().int().min(PIN_DISPLAY_LIMIT).max(EXTENDED_PIN_DISPLAY_LIMIT).default(PIN_DISPLAY_LIMIT),
});

// pins: profileSchema.shape.pins.optional(),
// TODO: figure out how to input pin information (currently using uuid of pins??)
export const uiEditProfileFormSchema = profileSchema.pick({
  username: true,
  bio: true,
  location: true,
});
