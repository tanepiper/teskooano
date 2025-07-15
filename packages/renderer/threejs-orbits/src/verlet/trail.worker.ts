import * as THREE from "three";
import { TrailDataPool } from "./TrailDataPool";

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

const qualityToBudget: Record<string, number> = {
  Low: 1000,
  Med: 1750,
  High: 2500,
  Ultra: 3000,
  Cosmic: 5000,
};

const lastPoints = new Map<string, [number, number, number]>();
const MIN_DISTANCE_SQ_TO_ADD = 1e-12; // Used to filter out nearly duplicate points

self.onmessage = (e: MessageEvent<TrailCommand>) => {
  const command = e.data;

  switch (command.type) {
    case "update": {
      const { objectId, position, quality } = command;

      // --- Filter out duplicate points before processing ---
      const lastPoint = lastPoints.get(objectId);
      if (lastPoint) {
        const dx = position[0] - lastPoint[0];
        const dy = position[1] - lastPoint[1];
        const dz = position[2] - lastPoint[2];
        if (dx * dx + dy * dy + dz * dz < MIN_DISTANCE_SQ_TO_ADD) {
          return; // Point is too close to the last one, ignore it.
        }
      }
      lastPoints.set(objectId, position);

      // Ensure a slot is allocated for the object.
      trailDataPool.allocate(objectId);

      // Add the new position directly to the ArrayBuffer.
      trailDataPool.addPoint(objectId, position[0], position[1], position[2]);

      const rawPoints = trailDataPool.getPoints(objectId);

      // No longer using spline for greater accuracy; sending raw points directly.
      self.postMessage({
        objectId,
        points: rawPoints,
        maxHistoryLength: trailDataPool.pointsPerSlot,
      });

      break;
    }
    case "remove": {
      trailDataPool.free(command.objectId);
      lastPoints.delete(command.objectId);
      break;
    }
    case "clear-all": {
      trailDataPool.clear();
      lastPoints.clear();
      break;
    }
  }
};
