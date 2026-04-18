import { profileSchema } from "@pinpoint/contracts";
import type { z } from "zod";
import { authServer } from "../../libs/auth-server";
import { protectedProcedure, publicProcedure } from "../../libs/orpc-procedures";
import { ProfileService } from "./profile-service";

async function hydrateProfileImage<T extends { _id: string; image?: string | undefined }>(profile: T): Promise<T> {
  if (profile.image) return profile;

  const authContext = await authServer.$context;
  const authUser = await authContext.internalAdapter.findUserById(profile._id);

  if (!authUser?.image) return profile;

  return {
    ...profile,
    image: authUser.image,
  };
}

export const profileRouter = {
  createProfile: protectedProcedure.profile.createProfile.handler(
    async ({ input, context, errors: { FORBIDDEN, UNPROCESSABLE_CONTENT, INTERNAL_SERVER_ERROR } }) => {
      const id = context.user.id;

      const existingProfile = await ProfileService.findById(id).lean();
      if (existingProfile) {
        throw FORBIDDEN({
          data: {
            message: `Profile with id ${id} already exists.`,
          },
        });
      }

      const profilePayload: z.input<typeof profileSchema> = {
        _id: id,
        image: context.user.image ?? undefined,
        username: input.username,
        bio: input.bio,
        location: input.location,
        pins: {
          displayedPins: [],
          uniquePinCount: 0,
        },
        createdAt: new Date(),
      };

      const tryParse = profileSchema.safeParse(profilePayload);

      if (!tryParse.success) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: `Failed to confirm: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await ProfileService.insertOne(profilePayload);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to insert profile by _id ${id}. ${error}`,
          },
        });
      }

      return { id };
    }
  ),

  deleteProfile: publicProcedure.profile.deleteProfile.handler(
    async ({ input, context, errors: { NOT_FOUND, FORBIDDEN, INTERNAL_SERVER_ERROR } }) => {
      if (!(context.session && context.user)) {
        throw FORBIDDEN({
          data: {
            message: "You must be logged in to delete a profile.",
          },
        });
      }

      if (input.id !== context.user.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }

      const profile = await ProfileService.findById(input).select({ _id: 1 }).lean();

      if (!profile) {
        throw NOT_FOUND({
          data: {
            message: `Profile with id ${input} not found.`,
          },
        });
      }

      try {
        const deleteResult = await ProfileService.deleteOne({ _id: input });
        if (deleteResult.deletedCount === 1) return { success: true };
        return { success: false };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to delete profile with id ${input}. ${error}`,
          },
        });
      }
    }
  ),

  editProfile: protectedProcedure.profile.editProfile.handler(
    async ({ input, context, errors: { INTERNAL_SERVER_ERROR, NOT_FOUND, FORBIDDEN, UNPROCESSABLE_CONTENT } }) => {
      if (context.user.id !== input.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }
      const profile = await ProfileService.findById(input.id).lean();

      if (!profile) {
        throw NOT_FOUND({
          data: {
            message: `Profile with id ${input.id} not found.`,
          },
        });
      }

      // TODO: add updated pins for profiles
      const updatedProfile = {
        ...profile,
        username: input.username ?? profile.username,
        bio: input.bio ?? profile.bio,
        location: input.location ?? profile.location,
      };

      const tryParse = profileSchema.safeParse(updatedProfile);

      if (!tryParse.success) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: `Failed to conform: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await ProfileService.updateOne({ _id: input.id }, { $set: updatedProfile });
        return { success: true };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to update profile with id ${input.id}. ${error}`,
          },
        });
      }
    }
  ),

  getProfileById: publicProcedure.profile.getProfileById.handler(async ({ input, errors: { NOT_FOUND } }) => {
    const profile = await ProfileService.findById(input.id).lean();

    if (!profile) {
      throw NOT_FOUND({
        data: {
          message: `Profile with id ${input.id} not found.`,
        },
      });
    }

    return hydrateProfileImage(profile);
  }),

  getProfileByUsername: publicProcedure.profile.getProfileByUsername.handler(async ({ input, errors: { NOT_FOUND } }) => {
    const profile = await ProfileService.findOne({ username: input.username }).lean();

    if (!profile) {
      throw NOT_FOUND({
        data: {
          message: `Profile with username ${input.username} not found.`,
        },
      });
    }

    return hydrateProfileImage(profile);
  }),
};
