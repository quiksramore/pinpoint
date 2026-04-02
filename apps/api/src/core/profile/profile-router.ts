import { profileSchema } from "node_modules/@pinpoint/contracts/src/http/profile/profile-schema";
import { protectedProcedure, publicProcedure } from "src/libs/orpc-procedures";
import { ProfileService } from "./profile-service";

export const profileRouter = {
  createProfile: protectedProcedure.profile.createProfile.handler(
    async ({ input, context, errors: { UNPROCESSABLE_CONTENT, INTERNAL_SERVER_ERROR } }) => {
      const id = context.user.id;

      const profilePayload = {
        _id: id,
        username: input.username,
        bio: input.bio ?? "",
        location: input.location ?? "",
        followers: 0,
        following: 0,
        postCount: 0,
        pins: {
          displayedPins: [],
          uniquePinCount: 0,
        },
        maxDisplayPinCount: 2,
        createdAt: new Date(),
      };

      const tryParse = profileSchema.safeParse(profilePayload);

      if (!tryParse.success) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: `Invalid Input: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await ProfileService.insertOne(profilePayload);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to insert profile by _id ${id}. ${error}`,
          },
        });
      }

      return { _id: id };
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

      if (context.user.id !== input) {
        throw FORBIDDEN({
          data: {
            message: "You are not allowed to delete this profile.",
          },
        });
      }

      const profile = await ProfileService.findById(input).select({ _id: 1 }).lean();

      if (!profile) {
        throw NOT_FOUND({
          data: {
            message: `Profile not found from ${context.user.name} with id ${input}`,
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
      if (context.user.id !== input._id) {
        throw FORBIDDEN({
          data: {
            message: "You are not allowed to edit this profile.",
          },
        });
      }
      const profile = await ProfileService.findById(input._id).select({ _id: 1 }).lean();

      if (!profile) {
        throw NOT_FOUND({
          data: {
            message: `Profile not found with id ${input._id}`,
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
            message: `Invalid Input: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await ProfileService.updateOne({ _id: input._id }, { $set: updatedProfile });
        return { success: true };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to update profile with id ${input._id}. ${error}`,
          },
        });
      }
    }
  ),
  getProfileById: publicProcedure.profile.getProfile.handler(async ({ input, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
    try {
      const profile = await ProfileService.findById(input).lean();

      if (!profile) {
        throw NOT_FOUND({
          data: {
            message: `Profile not found with id ${input}`,
          },
        });
      }

      return profile;
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `DB failed to fetch profile with id ${input}. ${error}`,
        },
      });
    }
  }),
};
