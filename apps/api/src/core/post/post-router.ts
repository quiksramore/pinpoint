import { ORPCError } from "@orpc/server";
import { pointSchema, postSchema } from "@pinpoint/contracts";
import { v7 as uuidv7 } from "uuid";
import { protectedProcedure } from "../../libs/orpc-procedures";
import { getStrongestCluster } from "./location-util";
import { PostService } from "./post-service";

export const postRouter = {
  createPost: protectedProcedure.post.createPost.handler(async ({ input, context, errors }) => {
    const fallbackPoint = pointSchema.parse({ type: "Point", coordinates: [0, 0] });

    // TODO
    if (1 === 1) throw new ORPCError("NOT_IMPLEMENTED");

    // TODO: replace placeholder URL + location with real upload + extracted geolcoation metadata.
    const images = input.images.map(({ id }) => ({
      url: `/uploads/${id}`,
      location: fallbackPoint,
    }));

    const imagePoints = images.map((image) => image.location);
    const { center: location, finalCluster } = getStrongestCluster(imagePoints);

    if (finalCluster.length !== images.length) {
      throw errors.UNPROCESSABLE_CONTENT({
        data: {
          message: "The images provided are too geographically spread apart. Please provide images that are closer together.",
        },
      });
    }

    const postPayload = {
      _id: uuidv7(),
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

    const parsedPost = postSchema.safeParse(postPayload);
    if (!parsedPost.success) {
      throw errors.UNPROCESSABLE_CONTENT({
        data: {
          message: parsedPost.error.issues.map((issue) => issue.message).join(", "),
        },
      });
    }

    const createdPost = await PostService.create(parsedPost.data);

    return { _id: createdPost._id };
  }),
  deletePost: protectedProcedure.post.deletePost.handler(async ({ input, context }) => {
    const post = await PostService.findById(input).select({ _id: 1, authorId: 1 }).lean();

    if (!post) {
      throw new ORPCError("NOT_FOUND", {
        message: "Post not found.",
      });
    }

    if (post.authorId !== context.user.id) {
      throw new ORPCError("FORBIDDEN", {
        message: "You are not allowed to delete this post.",
      });
    }

    const deleteResult = await PostService.deleteOne({ _id: input, authorId: context.user.id });

    // Handles rare race conditions (deleted between findById and deleteOne)
    if (deleteResult.deletedCount !== 1) {
      throw new ORPCError("NOT_FOUND", {
        message: "Post not found.",
      });
    }

    return { success: true };
  }),
  editPost: protectedProcedure.post.editPost.handler(async ({ input, context, errors }) => {
    const post = await PostService.findById(input._id).select({ _id: 1, authorId: 1 }).lean();

    if (!post) {
      throw errors.NOT_FOUND({
        data: {
          message: "Post not found.",
        },
      });
    }

    if (post.authorId !== context.user.id) {
      throw errors.FORBIDDEN({
        data: {
          message: "You are not allowed to edit this post.",
        },
      });
    }

    if (!(input.title || input.caption)) {
      throw errors.UNPROCESSABLE_CONTENT({
        data: {
          message: "No fields provided to update.",
        },
      });
    }

    const updatePayload = {
      editedAt: new Date(),
      ...(input.title && { title: input.title }),
      ...(input.caption && { caption: input.caption }),
    };

    const parsedUpdate = postSchema
      .pick({ title: true, caption: true, editedAt: true })
      .partial({ title: true, caption: true })
      .safeParse(updatePayload);

    if (!parsedUpdate.success) {
      throw errors.UNPROCESSABLE_CONTENT({
        data: {
          message: parsedUpdate.error.issues[0]?.message ?? "Invalid update payload.",
        },
      });
    }
    const result = await PostService.updateOne({ _id: input._id, authorId: context.user.id }, { $set: parsedUpdate.data });

    if (result.matchedCount === 0) {
      throw errors.NOT_FOUND({
        data: {
          message: "Post not found.",
        },
      });
    }

    return { success: true };
  }),
};
