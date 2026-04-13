import { tmpdir } from "node:os";
import { join } from "node:path";
import { pointSchema, postSchema, type voteSchema } from "@pinpoint/contracts";
import { S3Client, write } from "bun";
import { exiftool } from "exiftool-vendored";
import { fileTypeFromBuffer } from "file-type";
import heicConvert from "heic-convert";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure, publicProcedure } from "../../libs/orpc-procedures";
import { ProfileService } from "../profile/profile-service";
import { getStrongestCluster } from "./location-util";
import { PostService } from "./post-service";
import { VoteService } from "./vote-service";

export const uploadToR2 = async (postId: string, file: File, index: number) => {
  const fileBuffer = await file.arrayBuffer();
  let uploadMimeType = (await fileTypeFromBuffer(fileBuffer))?.mime;

  let fileExtension = file.name.split(".").pop();
  let body = fileBuffer;

  if (uploadMimeType === "image/heic" || uploadMimeType === "image/heif") {
    body = await heicConvert({
      buffer: Buffer.from(fileBuffer),
      format: "JPEG",
      quality: 1,
    });

    fileExtension = "jpg";
    uploadMimeType = "image/jpeg";
  }

  const s3 = new S3Client({
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  });

  const key = `${postId}/${index}`;
  await write(s3.file(`${key}.${fileExtension}`), new Blob([body], { type: uploadMimeType }));

  Bun.gc(true); // heic-convert has some sort of memory leak.

  return `${key}.${fileExtension}`;
};

export const postRouter = {
  // TODO convert this to protectedProcedure
  createPost: publicProcedure.posts.createPost.handler(
    async ({ input, context, errors: { UNPROCESSABLE_CONTENT, INTERNAL_SERVER_ERROR, NOT_FOUND } }) => {
      const id = uuidv7();

      // const profileDocument = await ProfileService.findById({ _id: context.user.id });
      // if (!profileDocument) {
      //   throw NOT_FOUND({
      //     data: { message: `User not found with id: ${context.user.id}` },
      //   });
      // }

      const synthesisedImages = await Promise.all(
        input.images.map(async (file, index) => {
          const originalBuffer = await file.arrayBuffer();

          const tempDir = tmpdir();
          const inputPath = join(tempDir, `${uuidv7()}-${file.name}`);
          await Bun.write(inputPath, originalBuffer);

          try {
            // Read EXIF from the original file before conversion
            const exifTags = await exiftool.read(inputPath);
            const latitude = exifTags.GPSLatitude;
            const longitude = exifTags.GPSLongitude;

            if (latitude === undefined || longitude === undefined) {
              throw UNPROCESSABLE_CONTENT({
                data: {
                  message: `Image ${file.name} does not contain GPS coordinates.`,
                },
              });
            }

            const location: z.infer<typeof pointSchema> = pointSchema.parse({
              latitude,
              longitude,
            });

            // upload image to R2
            const suburl = await uploadToR2(id, file, index);

            return {
              suburl,
              location,
            };
          } finally {
            Bun.file(inputPath).delete();
          }
        })
      );

      const { center: location, finalCluster } = getStrongestCluster(synthesisedImages.map((image) => image.location));

      if (finalCluster.length !== synthesisedImages.length) {
        throw UNPROCESSABLE_CONTENT({
          data: {
            message: "The images provided are too geographically spread apart. Please provide images that are closer together.",
          },
        });
      }

      const postDoc: z.infer<typeof postSchema> = {
        _id: id,
        // authorId: context.user.id,
        authorId: id,
        authorSnapshot: {
          // name: context.user.name,
          name: "foofoo",
          // image: context.user.image ?? "",
          image: "www.example.com",
        },
        title: input.title,
        caption: input.caption,
        images: synthesisedImages,
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

  deletePost: protectedProcedure.posts.deletePost.handler(
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

  editPost: protectedProcedure.posts.editPost.handler(
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

  getPosts: protectedProcedure.posts.getPosts.handler(
    async ({ input }) => await PostService.find({ authorId: input }).sort({ createdAt: -1 }).lean()
  ),

  getPostById: protectedProcedure.posts.getPostById.handler(async ({ input: postId, errors: { NOT_FOUND } }) => {
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
  // TODO: endpoint just for MVP, REMOVE IN PRODUCTION
  getAllPosts: publicProcedure.posts.getAllPosts.handler(async () => await PostService.find({}).sort({ createdAt: -1 }).lean()),

  addVote: protectedProcedure.posts.addVote.handler(
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
        authorId: input.authorId,
        voteValue: input.voteValue,
        createdAt: new Date(),
      };

      const tryParse = postSchema.safeParse(voteDoc);

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

      return { _id: id };
    }
  ),

  getUserVote: protectedProcedure.posts.getUserVote.handler(async ({ input, context, errors: { NOT_FOUND } }) => {
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

    const vote = await VoteService.findOne({ authorId: profile, postId: post });

    if (!vote) {
      throw NOT_FOUND({
        data: {
          message: `Vote not found with authorId: ${profile} and postId: ${post}`,
        },
      });
    }

    return vote;
  }),

  deleteVote: protectedProcedure.posts.deleteVote.handler(
    async ({ input: postId, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR, FORBIDDEN } }) => {
      const postDoc = await PostService.findOne({ _id: postId });

      if (!postDoc) {
        throw NOT_FOUND({
          data: {
            message: `Post with id ${postId} not found.`,
          },
        });
      }

      if (postDoc.authorId !== context.user.id) {
        throw FORBIDDEN({
          data: {
            message: "Forbidden.",
          },
        });
      }

      try {
        const deleteResult = await VoteService.deleteOne({ _id: postId });
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
};
