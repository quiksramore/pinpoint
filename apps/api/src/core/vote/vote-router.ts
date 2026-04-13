import { voteSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { PostService } from "../post/post-service";
import { ProfileService } from "../profile/profile-service";
import { VoteService } from "./vote-service";

export const voteRouter = {
  addVote: protectedProcedure.vote.addVote.handler(
    async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR, UNPROCESSABLE_CONTENT } }) => {
      const profileDoc = await ProfileService.findOne({ _id: context.user.id });

      if (!profileDoc) {
        throw NOT_FOUND({
          data: { message: `User not found with id: ${context.user.id}` },
        });
      }

      const post = await PostService.findById(input.postId).select({ _id: 1 }).lean();

      if (!post) {
        throw NOT_FOUND({
          data: {
            message: `Post with id ${input.postId} not found`,
          },
        });
      }

      const id = uuidv7();

      const voteDoc: z.infer<typeof voteSchema> = {
        _id: id,
        postId: input.postId,
        authorId: context.user.id,
        voteValue: input.voteValue,
        createdAt: new Date(),
      };

      const tryParse = voteSchema.safeParse(voteDoc);

      if (!tryParse.success) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: `Invalid Input: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await VoteService.insertOne(voteDoc);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to insert document by _id ${id}. ${error}`,
          },
        });
      }

      try {
        await PostService.updateOne(
          { _id: input.postId },
          {
            $inc: {
              "metrics.upvotes": input.voteValue === "UPVOTE" ? 1 : 0,
              "metrics.downvotes": input.voteValue === "DOWNVOTE" ? 1 : 0,
            },
          }
        );
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to update post metrics for id ${input.postId}. ${error}`,
          },
        });
      }

      return { id };
    }
  ),

  deleteVote: protectedProcedure.vote.deleteVote.handler(async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN } }) => {
    const voteDoc = await VoteService.findOne({ _id: input.id });

    if (!voteDoc) {
      throw NOT_FOUND({
        data: {
          message: `Vote with id ${input.id} not found.`,
        },
      });
    }

    if (voteDoc.authorId !== context.user.id) {
      throw FORBIDDEN({
        data: {
          message: "Forbidden.",
        },
      });
    }

    try {
      const deleteResult = await VoteService.deleteOne({ _id: input.id });
      const updateVotes = await PostService.updateOne(
        { _id: voteDoc.postId },
        {
          $inc: {
            "metrics.upvotes": voteDoc.voteValue === "UPVOTE" ? -1 : 0,
            "metrics.downvotes": voteDoc.voteValue === "DOWNVOTE" ? -1 : 0,
          },
        }
      );
      if (deleteResult.deletedCount === 1 && updateVotes.modifiedCount === 1) return { success: true };
      return { success: false };
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `DB failed to delete vote with id ${input.id}: ${error}`,
        },
      });
    }
  }),

  getUserVote: protectedProcedure.vote.getUserVote.handler(async ({ input, context, errors: { NOT_FOUND } }) => {
    const post = await PostService.findById(input.postId).lean();

    if (!post) {
      throw NOT_FOUND({
        data: {
          message: `Post with id ${input.postId} not found`,
        },
      });
    }
    const profile = await ProfileService.findOne({ _id: context.user.id });

    if (!profile) {
      throw NOT_FOUND({
        data: {
          message: `User not found with id: ${context.user.id}`,
        },
      });
    }

    const vote = await VoteService.findOne({ authorId: profile._id, postId: post._id });

    if (!vote) {
      throw NOT_FOUND({
        data: {
          message: `Vote not found with authorId: ${profile._id} and postId: ${post._id}`,
        },
      });
    }

    return vote;
  }),
};
