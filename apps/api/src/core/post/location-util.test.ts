import { expect, test, describe } from "bun:test";
import type { pointSchema } from "node_modules/@pinpoint/contracts/src/http/posts/post-schema";
import type z from "zod";
import { findStrongestPoint, getInnerCluster, calculateCentroid, getStrength } from "./location-util";
import { P } from "node_modules/@orpc/server/dist/shared/server.qKsRrdxW.mjs";

interface PointCluster {
  cluster: number;
  points: z.infer<typeof pointSchema>[];
}

const testPoints: PointCluster[] = [
  {
    cluster: 1,
    points: [
      { type: "Point", coordinates: [37.00198, -122.05876] },
      { type: "Point", coordinates: [37.00208, -122.05833] },
      { type: "Point", coordinates: [37.00195, -122.05845] },
      { type: "Point", coordinates: [37.00169, -122.05899] },
      { type: "Point", coordinates: [37.00174, -122.0592] },
    ],
  },
  {
    cluster: 2,
    points: [
      { type: "Point", coordinates: [37.00203, -122.05826] },
      { type: "Point", coordinates: [37.00202, -122.05837] },
      { type: "Point", coordinates: [37.0019, -122.05846] },
    ],
  },
  {
    cluster: 3,
    points: [
      { type: "Point", coordinates: [37.00202, -122.05834] },
      { type: "Point", coordinates: [37.00193, -122.05852] },
    ],
  },
  {
    cluster: 4,
    points: [
      { type: "Point", coordinates: [37.00202, -122.05834] },
      { type: "Point", coordinates: [37.00193, -122.05852] },
      { type: "Point", coordinates: [36.9995, -122.06361] },
    ],
  },
  {
    cluster: 5,
    points: [
      { type: "Point", coordinates: [37.00202, -122.05834] },
      { type: "Point", coordinates: [37.00193, -122.05852] },
      { type: "Point", coordinates: [37.00075, -122.06052] },
    ],
  },
  {
    cluster: 6,
    points: [
      { type: "Point", coordinates: [37.00197, -122.05839] },
      { type: "Point", coordinates: [37.00202, -122.05839] },
      { type: "Point", coordinates: [37.00199, -122.05848] },
    ],
  },
  {
    cluster: 7,
    points: [
      { type: "Point", coordinates: [37.00236, -122.05834] },
      { type: "Point", coordinates: [37.00196, -122.05927] },
      { type: "Point", coordinates: [37.00153, -122.05808] },
    ],
  },
];

describe("strongest point", () => {
  test("finds the strongest point for cluster 1", () => {
    const cluster1 = testPoints[0].points;
    expect(findStrongestPoint(cluster1)).toBe(0);
  });
  test("finds the strongest point for cluster 2", () => {
    const cluster2 = testPoints[1].points;
    expect(findStrongestPoint(cluster2)).toBe(1);
  });
  test("finds the strongest point for cluster 3", () => {
    const cluster3 = testPoints[2].points;
    expect(findStrongestPoint(cluster3)).toBe(0);
  });
});

describe("strongest cluster", () => {
  test("finds the inner cluster 1", () => {
    expect(getInnerCluster(testPoints[0].points, findStrongestPoint(testPoints[0].points))).toEqual([
      testPoints[0].points[0],
      testPoints[0].points[1],
      testPoints[0].points[2],
      testPoints[0].points[3],
      testPoints[0].points[4],
    ]);
  });
  test("finds the inner cluster 4", () => {
    expect(getInnerCluster(testPoints[3].points, findStrongestPoint(testPoints[3].points))).toEqual([
      testPoints[3].points[0],
      testPoints[3].points[1],
    ]);
  });
  test("finds the inner cluster 5", () => {
    expect(getInnerCluster(testPoints[4].points, findStrongestPoint(testPoints[4].points))).toEqual([
      testPoints[4].points[0],
      testPoints[4].points[1],
      testPoints[4].points[2],
    ]);
  });
});

describe("strength test", () => {
  test("cluster 1 vs cluster 2", () => {
    const cluster1 = getInnerCluster(testPoints[0].points, findStrongestPoint(testPoints[0].points));
    const center1 = calculateCentroid(cluster1);
    const cluster2 = getInnerCluster(testPoints[1].points, findStrongestPoint(testPoints[1].points));
    const center2 = calculateCentroid(cluster2);
    console.log("Strength of cluster 1:", getStrength(cluster1, center1));
    console.log("Strength of cluster 2:", getStrength(cluster2, center2));

    expect(getStrength(cluster1, center1)).toBeGreaterThan(getStrength(cluster2, center2));
  });
  test("cluster 6 vs cluster 7", () => {
    const cluster6 = getInnerCluster(testPoints[5].points, findStrongestPoint(testPoints[5].points));
    const center6 = calculateCentroid(cluster6);
    const cluster7 = getInnerCluster(testPoints[6].points, findStrongestPoint(testPoints[6].points));
    const center7 = calculateCentroid(cluster7);
    console.log("Strength of cluster 6:", getStrength(cluster6, center6));
    console.log("Strength of cluster 7:", getStrength(cluster7, center7));

    expect(getStrength(cluster7, center7)).toBeGreaterThan(getStrength(cluster6, center6));
  });
});
