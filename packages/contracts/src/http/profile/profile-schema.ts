import z from "zod";
import { pinTypes } from "../pins-and-points/pins-schema";

export const PIN_DISPLAY_LIMIT = 2;
export const EXTENDED_PIN_DISPLAY_LIMIT = 5;

// TODO: figure out max character lengths for certain attributes
export const profileSchema = z.object({
  _id: z.uuidv7(),
  username: z.string().min(3).max(30),
  bio: z.string().min(2).max(200).optional(),
  // TODO: how
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
  createdAt: z.coerce.date(),
});
