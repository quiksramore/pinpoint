import { pointSchema } from "@pinpoint/contracts";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";

const MAX_CLUSTER_DISTANCE_METERS = 250;
const ADDITIONAL_OUTER_RADIUS_METERS = 750;
export const postRouter = {
  createPost: protectedProcedure.post.createPost.handler(({ input, context }) => {
    // TODO
  }),
};

function getStrongestCluster(points: z.infer<typeof pointSchema>[]) {
  const strongestIndex = findStrongestPoint(points);
  const innerCluster = getInnerCluster(points, strongestIndex);

  const center = calculateCentroid(innerCluster);

  const strength = getStrength(innerCluster, center);

  const outerRadius = MAX_CLUSTER_DISTANCE_METERS + strength * ADDITIONAL_OUTER_RADIUS_METERS;

  const finalCluster = filterFinalCluster(points, center, outerRadius);

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

  // For each point, count how many other points are within the MAX_CLUSTER_DISTANCE_METERS and calculate the average distance to those points
  points.forEach(({ coordinates: [long1, lat1] }, index) => {
    let pointsContained = 0;
    let totalDistance = 0;

    points.forEach(({ coordinates: [long2, lat2] }, index2) => {
      if (index === index2) return;

      const dist = distanceMeters(long1, lat1, long2, lat2);

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
  const metersPerDegLat = 111_320;
  const metersPerDegLon = 111_320 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);

  const dx = (long2 - long1) * metersPerDegLon;
  const dy = (lat2 - lat1) * metersPerDegLat;

  return Math.sqrt(dx * dx + dy * dy);
}

function calculateCentroid(points: z.infer<typeof pointSchema>[]): z.infer<typeof pointSchema> {
  const centroidLat = points.reduce((acc, point) => acc + point.coordinates[1], 0) / points.length;
  const centroidLng = points.reduce((acc, point) => acc + point.coordinates[0], 0) / points.length;
  return pointSchema.parse({ type: "Point", coordinates: [centroidLng, centroidLat] });
}
