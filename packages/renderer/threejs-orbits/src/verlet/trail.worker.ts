import { OSVector3 } from "@teskooano/core-math";
import { catmullRomSpline } from "../utils/spline";
import { TrailDataPool } from "./TrailDataPool";
import { simplifyPath } from "../utils/simplify";

type TrailCommand =
  | {
      type: "update";
      objectId: string;
      position: [number, number, number];
      maxHistoryLength: number; // This can now be considered 'pointsPerSlot'
      quality: string;
    }
  | { type: "remove"; objectId: string }
  | { type: "clear-all" };

// Pre-allocate a large pool for trail data.
// 200 objects, 50k points each = 10 million points total.
// Each point is 3 floats (12 bytes). Total buffer size: ~120 MB.
const trailDataPool = new TrailDataPool(200, 50000);

const SIMPLIFICATION_THRESHOLD = 4000;
const SIMPLIFICATION_EPSILON = 0.1;

const qualityToBudget: Record<string, number> = {
  Low: 100000,
  Med: 175000,
  High: 250000,
  Ultra: 300000,
  Cosmic: 500000,
};

self.onmessage = (e: MessageEvent<TrailCommand>) => {
  const command = e.data;

  switch (command.type) {
    case "update": {
      const { objectId, position, maxHistoryLength, quality } = command;

      // Ensure a slot is allocated for the object.
      trailDataPool.allocate(objectId);

      // Add the new position directly to the ArrayBuffer.
      trailDataPool.addPoint(objectId, position[0], position[1], position[2]);

      // Retrieve the points for processing. This part is not yet fully
      // optimized to read from the circular buffer structure correctly,
      // but it demonstrates the new data flow.
      const rawPoints = trailDataPool.getPoints(objectId);

      // The rest of the processing pipeline remains similar.
      const allPoints = rawPoints.map((p) => new OSVector3(p[0], p[1], p[2]));
      let pointsToRender = allPoints;

      if (allPoints.length > SIMPLIFICATION_THRESHOLD) {
        const simplifiedPoints = simplifyPath(
          allPoints,
          SIMPLIFICATION_EPSILON,
        );
        if (simplifiedPoints.length > 2) {
          const budget = qualityToBudget[quality] || 250000;
          pointsToRender = catmullRomSpline(simplifiedPoints, budget);
        } else {
          pointsToRender = simplifiedPoints;
        }
      }

      const points = pointsToRender.map(
        (p) => [p.x, p.y, p.z] as [number, number, number],
      );

      self.postMessage({
        objectId,
        points,
        maxHistoryLength: trailDataPool.pointsPerSlot,
      });

      break;
    }
    case "remove": {
      trailDataPool.free(command.objectId);
      break;
    }
    case "clear-all": {
      trailDataPool.clear();
      break;
    }
  }
};
