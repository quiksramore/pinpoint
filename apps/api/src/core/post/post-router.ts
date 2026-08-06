import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LATITUDE_MAX,
  LATITUDE_MIN,
  LONGITUDE_MAX,
  LONGITUDE_MIN,
  LONGITUDE_RANGE,
  type getMapMarkersInputSchema,
  pointSchema,
  postSchema,
} from "@pinpoint/contracts";
import { S3Client, write } from "bun";
import { exiftool } from "exiftool-vendored";
import { fileTypeFromBuffer } from "file-type";
import heicConvert from "heic-convert";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { protectedProcedure, publicProcedure } from "../../libs/orpc-procedures";
import { ProfileService } from "../profile/profile-service";
import { VoteService } from "../vote/vote-service";
import { getStrongestCluster } from "./location-util";
import { PostService } from "./post-service";

type MapBounds = z.infer<typeof getMapMarkersInputSchema>["bounds"];

const createBoundsPolygon = (west: number, south: number, east: number, north: number) => ({
  type: "Polygon",
  coordinates: [
    [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
      [west, south],
    ],
  ],
});

const createViewportMatch = (bounds: MapBounds) => {
  if (bounds.west === LONGITUDE_MIN && bounds.east === LONGITUDE_MAX && bounds.south === LATITUDE_MIN && bounds.north === LATITUDE_MAX) {
    return {};
  }

  if (bounds.west <= bounds.east) {
    if (bounds.east - bounds.west > LONGITUDE_RANGE / 2) {
      return {
        $or: [
          {
            location: {
              $geoWithin: {
                $geometry: createBoundsPolygon(bounds.west, bounds.south, 0, bounds.north),
              },
            },
          },
          {
            location: {
              $geoWithin: {
                $geometry: createBoundsPolygon(0, bounds.south, bounds.east, bounds.north),
              },
            },
          },
        ],
      };
    }

    return {
      location: {
        $geoWithin: {
          $geometry: createBoundsPolygon(bounds.west, bounds.south, bounds.east, bounds.north),
        },
      },
    };
  }

  return {
    $or: [
      {
        location: {
          $geoWithin: {
            $geometry: createBoundsPolygon(bounds.west, bounds.south, LONGITUDE_MAX, bounds.north),
          },
        },
      },
      {
        location: {
          $geoWithin: {
            $geometry: createBoundsPolygon(LONGITUDE_MIN, bounds.south, bounds.east, bounds.north),
          },
        },
      },
    ],
  };
};

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
  createPost: protectedProcedure.posts.createPost.handler(
    async ({ input, context, errors: { UNPROCESSABLE_CONTENT, NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
      const id = uuidv7();

      const profileDocument = await ProfileService.findById(context.user.id);
      if (!profileDocument) {
        throw NOT_FOUND({
          data: { message: `Profile with id ${context.user.id} not found` },
        });
      }

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

            // TODO investigate why zod doesn't throw ts error when modifying invalid parse
            const location: z.infer<typeof pointSchema> = pointSchema.parse({
              type: "Point",
              coordinates: [longitude, latitude],
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
        authorId: context.user.id,
        authorSnapshot: {
          name: context.user.name,
          image: context.user.image ?? "",
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
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to conform: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        await PostService.insertOne(postDoc);
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `Failed to insert document by _id=${id}. ${error}`,
          },
        });
      }

      return { id };
    }
  ),

  deletePost: protectedProcedure.posts.deletePost.handler(async ({ input, context, errors: { NOT_FOUND, INTERNAL_SERVER_ERROR } }) => {
    const post = await PostService.findById(input.id).select({ _id: 1, authorId: 1 }).lean();

    if (!post) {
      throw NOT_FOUND({
        data: {
          message: `Post with id ${input.id} not found.`,
        },
      });
    }

    if (post.authorId !== context.user.id) {
      // throwing NOT_FOUND for security.
      throw NOT_FOUND({
        data: {
          message: `Post with id ${input.id} not found.`,
        },
      });
    }

    try {
      const deleteResult = await PostService.deleteOne({ _id: input.id });
      if (deleteResult.deletedCount === 1) return { success: true };
      return { success: false };
    } catch (error) {
      throw INTERNAL_SERVER_ERROR({
        data: {
          message: `DB failed to delete post with id ${input.id}: ${error}`,
        },
      });
    }
  }),

  editPost: protectedProcedure.posts.editPost.handler(
    async ({ input, context, errors: { INTERNAL_SERVER_ERROR, NOT_FOUND, UNPROCESSABLE_CONTENT } }) => {
      const post = await PostService.findById(input.id).select({ _id: 1, authorId: 1 }).lean();

      if (!post) {
        throw NOT_FOUND({
          data: {
            message: `Post with id ${input.id} not found.`,
          },
        });
      }

      if (post.authorId !== context.user.id) {
        // throwing NOT_FOUND for security.
        throw NOT_FOUND({
          data: {
            message: `Post with id ${input.id} not found.`,
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
            message: `Failed to conform: ${tryParse.error.issues.map((issue) => issue.message).join(", ")}`,
          },
        });
      }

      try {
        const result = await PostService.updateOne({ _id: input.id, authorId: context.user.id }, { $set: tryParse.data });
        if (result.matchedCount === 0) return { success: true };
        return { success: false };
      } catch (error) {
        throw INTERNAL_SERVER_ERROR({
          data: {
            message: `DB failed to edit post with id ${input.id}. ${error}`,
          },
        });
      }
    }
  ),

  getPostsByProfileId: protectedProcedure.posts.getPostsByProfileId.handler(
    async ({ input }) => await PostService.find({ authorId: input.profileId }).sort({ createdAt: -1 }).lean()
  ),

  getPostById: protectedProcedure.posts.getPostById.handler(async ({ input, errors: { NOT_FOUND } }) => {
    const post = await PostService.findById(input.id).lean();

    if (!post) {
      throw NOT_FOUND({
        data: {
          message: `Post with id ${input.id} not found`,
        },
      });
    }

    return post;
  }),

  getMapMarkers: publicProcedure.posts.getMapMarkers.handler(async ({ input }) => {
    const documents = await PostService.aggregate<{
      _id: string;
      location: z.infer<typeof pointSchema>;
      thumbnailSuburl: string;
      title: string;
    }>([
      {
        $match: {
          ...createViewportMatch(input.bounds),
          "images.0.suburl": { $type: "string" },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: input.limit + 1 },
      {
        $project: {
          _id: 1,
          location: 1,
          title: 1,
          thumbnailSuburl: { $arrayElemAt: ["$images.suburl", 0] },
        },
      },
    ]);

    return {
      markers: documents.slice(0, input.limit).map((doc) => ({
        postId: doc._id,
        location: doc.location,
        thumbnailSuburl: doc.thumbnailSuburl,
        title: doc.title,
      })),
      hasMore: documents.length > input.limit,
    };
  }),

  // TODO: DELETE IN PRODUCTION, ENDPOINT JUST FOR MVP
  getAllPosts: publicProcedure.posts.getAllPosts.handler(async ({ context }) => {
    const documents = await PostService.find({}).sort({ createdAt: -1 }).lean();

    if (!context?.user) return documents;

    const postIds = documents.map((doc) => doc._id);

    const votes = await VoteService.find({
      postId: { $in: postIds },
      // biome-ignore lint/style/noNonNullAssertion: already checked for context
      authorId: context!.user!.id,
    });

    const voteMap = new Map(votes.map((v) => [v.postId.toString(), v.voteValue]));

    return documents.map((doc) => ({
      ...doc,
      vote: voteMap.get(doc._id.toString()),
    }));
  }),
};
