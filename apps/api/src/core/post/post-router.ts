import { pointSchema, postSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { getStrongestCluster } from "./location-util";
import { PostService } from "./post-service";

export const postRouter = {
  createPost: protectedProcedure.post.createPost.handler(
    async ({ input, context, errors: { UNPROCESSABLE_CONTENT, INTERNAL_SERVER_ERROR } }) => {
      const fallbackPoint = pointSchema.parse({ type: "Point", coordinates: [0, 0] });
      const id = uuidv7();

      // TODO: set up user validation
      //if (1 === 1) throw new ORPCError("NOT_IMPLEMENTED");

      // TODO: replace placeholder URL + location with real upload + extracted geolcoation metadata.
      const images = input.images.map(({ id }) => ({
        url: `/uploads/${id}`,
        location: fallbackPoint,
      }));

      const imagePoints = images.map((image) => image.location);
      const { center: location, finalCluster } = getStrongestCluster(imagePoints);

      if (finalCluster.length !== images.length) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "The images provided are too geographically spread apart. Please provide images that are closer together.",
          },
        });
      }

      const postDoc: z.infer<typeof postSchema> = {
        _id: id,
        authorId: context.user.id,
        authorSnapshot: {
          name: context.user.name,
          image: context.user.image ?? "",
        },
        title: input.title,
        caption: input.caption,
        images,
        location,
        metrics: {
          upvotes: 0,
          downvotes: 0,
          comments: 0,
        },
        createdAt: new Date(),
      };

      const tryParse = postSchema.safeParse(postDoc);

      if (!tryParse.success) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: `Invalid Input: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await PostService.insertOne(postDoc);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to insert document by _id ${id}. ${error}`,
          },
        });
      }

      return { _id: id };
    }
  ),
  deletePost: protectedProcedure.post.deletePost.handler(
    async ({ input: postId, context, errors: { NOT_FOUND, FORBIDDEN, INTERNAL_SERVER_ERROR } }) => {
      const post = await PostService.findById(postId).select({ _id: 1, authorId: 1 }).lean();

      if (!post) {
        throw NOT_FOUND({
          data: {
            message: `Post with id ${postId} not found.`,
          },
        });
      }

      if (post.authorId !== context.user.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }

      try {
        const deleteResult = await PostService.deleteOne({ _id: postId });
        if (deleteResult.deletedCount === 1) return { success: true };
        return { success: false };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to delete post with id ${postId}: ${error}`,
          },
        });
      }
    }
  ),
  editPost: protectedProcedure.post.editPost.handler(
    async ({ input, context, errors: { INTERNAL_SERVER_ERROR, NOT_FOUND, FORBIDDEN, UNPROCESSABLE_CONTENT } }) => {
      const post = await PostService.findById(input._id).select({ _id: 1, authorId: 1 }).lean();

      if (!post) {
        throw NOT_FOUND({
          data: {
            message: `Post with id ${input._id} not found.`,
          },
        });
      }

      if (post.authorId !== context.user.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }

      if (!input.title && !input.caption) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "No fields provided to update.",
          },
        });
      }

      const postUpdate = {
        editedAt: new Date(),
        ...(input.title !== undefined && { title: input.title }),
        ...(input.caption !== undefined && { caption: input.caption }),
      };

      const tryParse = postSchema
        .pick({ title: true, caption: true, editedAt: true })
        .partial({ title: true, caption: true })
        .safeParse(postUpdate);

      if (!tryParse.success) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: tryParse.error.issues[0]?.message ?? "Invalid update payload.",
          },
        });
      }

      try {
        const result = await PostService.updateOne({ _id: input._id, authorId: context.user.id }, { $set: tryParse.data });
        if (result.matchedCount === 0) return { success: true };
        return { success: false };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to edit post with id ${input._id}. ${error}`,
          },
        });
      }
    }
  ),

  getPosts: protectedProcedure.post.getPosts.handler(
    async ({ input }) => await PostService.find({ authorId: input }).sort({ createdAt: -1 }).lean()
  ),

  getPostById: protectedProcedure.post.getPostById.handler(async ({ input: postId, errors: { NOT_FOUND } }) => {
    const post = await PostService.findById(postId).lean();

    if (!post) {
      throw NOT_FOUND({
        data: {
          message: `Post with id ${postId} not found`,
        },
      });
    }

    return post;
  }),
};
