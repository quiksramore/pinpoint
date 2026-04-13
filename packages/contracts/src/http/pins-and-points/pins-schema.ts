import { z } from "zod";

export type pinType = Record<
  string,
  {
    name: string;
    description: string;
    image: string;
  }
>;

export const pinTypes: pinType = {
  Elevation500: {
    name: "Elevation 500",
    description: "You've reached an elevation of 500 meters.",
    image: "https://example.com/elevation500-pin.png",
  },
  Elevation1000: {
    name: "Elevation 1000",
    description: "You've reached an elevation of 1000 meters.",
    image: "https://example.com/elevation1000-pin.png",
  },
  Elevation2000: {
    name: "Elevation 2000",
    description: "You've reached an elevation of 2000 meters.",
    image: "https://example.com/elevation2000-pin.png",
  },
};

// individual pins that are awarded to specific post
export const pinSchema = z.object({
  _id: z.uuidv7(),
  name: z.enum(Object.keys(pinTypes)),
  ownerUserId: z.string(), // better-auth user id
  yieldingPostId: z.uuidv7(),
  createdAt: z.coerce.date(),
});
