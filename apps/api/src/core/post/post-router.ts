import { pointSchema, postSchema } from "@pinpoint/contracts";
import { ORPCError } from "@orpc/server";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { PostService } from "./post-service";
import { protectedProcedure } from "../../libs/orpc-procedures";

const MAX_CLUSTER_DISTANCE_METERS = 250;
const ADDITIONAL_OUTER_RADIUS_METERS = 750;
const METERS_PER_DEGREE_LATITUDE = 111_320;
const DEGREES_PER_HALF_TURN = 180;
export const postRouter = {
  createPost: protectedProcedure.post.createPost.handler(async ({ input, context }) => {
    const fallbackPoint = pointSchema.parse({ type: "Point", coordinates: [0, 0] });

    // TODO: replace placeholder URL + location with real upload + extracted geolcoation metadata.
    const images = input.images.map(({ id }) => ({
      url: `/uploads/${id}`,
      location: fallbackPoint,
    }));

    const imagePoints = images.map((image) => image.location);
    const { center: location, finalCluster } = getStrongestCluster(imagePoints);
    if (finalCluster.length !== images.length) {
      throw new ORPCError("FORBIDDEN", {
        message: "The images provided are too geographically spread out. Please provide images that are closer together.",
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
      throw new ORPCError("UNPROCESSABLE_CONTENT", {
        message: parsedPost.error.issues[0]?.message ?? "Invalid post payload.",
      });
    }

    const createdPost = await PostService.create(parsedPost.data);

    return { _id: createdPost._id };
  }),
};

function getStrongestCluster(points: z.infer<typeof pointSchema>[]) {
  const strongestIndex = findStrongestPoint(points);
  const innerCluster = getInnerCluster(points, strongestIndex);

  const center = calculateCentroid(innerCluster);

  const strength = getStrength(innerCluster, center);

  const outerRadius = MAX_CLUSTER_DISTANCE_METERS + strength * ADDITIONAL_OUTER_RADIUS_METERS;

  const finalCluster = filterFinalCluster(points, center, outerRadius); // Returns array of points

  return { center, finalCluster };
}

// HELPER FUNCTIONS -----------------------------------------------

function getAverageDistance(points: z.infer<typeof pointSchema>[], center: z.infer<typeof pointSchema>): number {
  const [cLng, cLat] = center.coordinates;

  const total = points.reduce((sum, p) => sum + distanceMeters(cLng, cLat, p.coordinates[0], p.coordinates[1]), 0);

  return total / points.length;
}

// Strength is a value between 0 and 1 indicating how tightly clustered the points are around the center. 0 means all points are at the center, 1 means points are spread out to the edge of MAX_CLUSTER_DISTANCE_METERS.
function getStrength(innerCluster: z.infer<typeof pointSchema>[], center: z.infer<typeof pointSchema>): number {
  const avgDist = getAverageDistance(innerCluster, center);

  // Normalize: 0 (tight) → 1 (spread out to edge of 250m)
  let strength = avgDist / MAX_CLUSTER_DISTANCE_METERS;

  // Clamp to [0,1]
  strength = Math.max(0, Math.min(1, strength));

  return strength;
}

function filterFinalCluster(points: z.infer<typeof pointSchema>[], center: z.infer<typeof pointSchema>, outerRadius: number) {
  const [cLng, cLat] = center.coordinates;

  return points.filter((p) => distanceMeters(cLng, cLat, p.coordinates[0], p.coordinates[1]) <= outerRadius);
}

// Returns the index of the strongest point, referring to points[] array
function findStrongestPoint(points: z.infer<typeof pointSchema>[]): number {
  let maxContained = 0;
  let maxIndex = 0;
  let bestAverage = Number.POSITIVE_INFINITY;

  // Cache pairwise distances to reuse in getInnerCluster and avoid redundant calculations
  const distanceMatrix: number[][] = points.map(() => []);

  // For each point, count how many other points are within the MAX_CLUSTER_DISTANCE_METERS and calculate the average distance to those points
  points.forEach(({ coordinates: [long1, lat1] }, index) => {
    let pointsContained = 0;
    let totalDistance = 0;

    points.forEach(({ coordinates: [long2, lat2] }, index2) => {
      if (index === index2) return;

      // Only compute each pair once
      const dist = distanceMatrix[index2]?.[index] ?? distanceMeters(long1, lat1, long2, lat2);
      const currentRow = distanceMatrix[index];
      if (currentRow) {
        currentRow[index2] = dist;
      }

      if (dist <= MAX_CLUSTER_DISTANCE_METERS) {
        pointsContained++;
        totalDistance += dist;
      }
    });

    const averageDistance = pointsContained === 0 ? Number.POSITIVE_INFINITY : totalDistance / pointsContained;
    // Update the strongest point if this point has more contained points, or if it has the same number of contained points but a smaller average distance
    if (pointsContained > maxContained || (pointsContained === maxContained && averageDistance < bestAverage)) {
      maxContained = pointsContained;
      bestAverage = averageDistance;
      maxIndex = index;
    }
  });

  return maxIndex;
}

function getInnerCluster(points: z.infer<typeof pointSchema>[], strongestIndex: number): z.infer<typeof pointSchema>[] {
  const [centerLong, centerLat] = points[strongestIndex]?.coordinates || [0, 0];

  // Filter points to include only those within MAX_CLUSTER_DISTANCE_METERS of the strongest point
  return points.filter((point) => {
    const [long, lat] = point.coordinates;
    return distanceMeters(centerLong, centerLat, long, lat) <= MAX_CLUSTER_DISTANCE_METERS;
  });
}

// Calculate distance
function distanceMeters(long1: number, lat1: number, long2: number, lat2: number) {
  const metersPerDegLat = METERS_PER_DEGREE_LATITUDE;
  const averageLatitude = (lat1 + lat2) / 2;
  const metersPerDegLon = METERS_PER_DEGREE_LATITUDE * Math.cos((averageLatitude * Math.PI) / DEGREES_PER_HALF_TURN);

  const dx = (long2 - long1) * metersPerDegLon;
  const dy = (lat2 - lat1) * metersPerDegLat;

  return Math.sqrt(dx * dx + dy * dy);
}

function calculateCentroid(points: z.infer<typeof pointSchema>[]): z.infer<typeof pointSchema> {
  const [sumLng, sumLat] = points.reduce(([lng, lat], p) => [lng + p.coordinates[0], lat + p.coordinates[1]], [0, 0]);
  const centroidLng = sumLng / points.length;
  const centroidLat = sumLat / points.length;

  return pointSchema.parse({ type: "Point", coordinates: [centroidLng, centroidLat] });
}
