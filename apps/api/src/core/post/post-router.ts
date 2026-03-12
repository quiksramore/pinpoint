import { pointSchema } from "@pinpoint/contracts";
import type { z } from "zod";
import { protectedProcedure } from "../../libs/orpc-procedures";

const MAX_CLUSTER_DISTANCE_METERS = 250;
export const postRouter = {
  createPost: protectedProcedure.post.createPost.handler(({ input, context }) => {
    // TODO
  }),
};

function calculateMidpointOfStrongestCluster(points: z.infer<typeof pointSchema>[]): z.infer<typeof pointSchema> {
  return pointSchema.parse({ type: "Point", coordinates: [0, 0] });
}

// Returns the index of the strongest point, referring to points[] array
function findStrongestPoint(points: z.infer<typeof pointSchema>[]): number {
  let maxContained = 0;
  let maxIndex = 0;
  let bestAverage = Number.POSITIVE_INFINITY;

  points.forEach(({ type, coordinates: [long1, lat1] }, index) => {
    let pointsContained = 0;
    let totalPointDistances = 0;

    points.forEach(({ type, coordinates: [long2, lat2] }, index2) => {
      if (index === index2) return;
      if (distanceMeters(long1, lat1, long2, lat2) <= MAX_CLUSTER_DISTANCE_METERS) {
        pointsContained++;
        totalPointDistances += distanceMeters(long1, lat1, long2, lat2);
      }
    });

    if (pointsContained > maxContained) {
      maxContained = pointsContained;
      maxIndex = index;
    }

    const averageDistance = totalPointDistances / pointsContained;
    if (averageDistance < bestAverage) {
      bestAverage = averageDistance;
    }
    if (pointsContained === maxContained && averageDistance < bestAverage) {
      maxIndex = index;
    }
  });
  return maxIndex;
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
