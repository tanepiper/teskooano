import { TrailDataPool } from "./TrailDataPool";

type TrailCommand =
  | {
      type: "update-batch";
      updates: Array<{
        objectId: string;
        position: [number, number, number];
        maxHistoryLength: number;
        quality: string;
      }>;
    }
  | { type: "remove"; objectId: string }
  | { type: "clear-all" }
  | { type: "set-max-points"; maxPoints: number };

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

// Configuration for performance tuning
const MAX_POINTS_TO_SEND = 500; // Reduced from 1000 for better performance
const BATCH_INTERVAL = 100; // Process batches every 100ms

const lastPoints = new Map<string, [number, number, number]>();
const MIN_DISTANCE_SQ_TO_ADD = 1e-10; // Increased threshold for better filtering

// Batch processing state
let pendingUpdates: Map<string, [number, number, number]> = new Map();
let lastBatchTime = 0;
let maxPointsToSend = MAX_POINTS_TO_SEND; // Configurable max points

self.onmessage = (e: MessageEvent<TrailCommand>) => {
  const command = e.data;

  switch (command.type) {
    case "update-batch": {
      const { updates } = command;
      const currentTime = Date.now();

      // Add all updates to pending batch
      for (const update of updates) {
        const { objectId, position } = update;

        // Filter out duplicate points before adding to batch
        const lastPoint = lastPoints.get(objectId);
        if (lastPoint) {
          const dx = position[0] - lastPoint[0];
          const dy = position[1] - lastPoint[1];
          const dz = position[2] - lastPoint[2];
          if (dx * dx + dy * dy + dz * dz < MIN_DISTANCE_SQ_TO_ADD) {
            continue; // Point is too close to the last one, skip it.
          }
        }

        pendingUpdates.set(objectId, position);
        lastPoints.set(objectId, position);
      }

      // Process batch if enough time has passed or if we have many updates
      if (
        currentTime - lastBatchTime >= BATCH_INTERVAL ||
        pendingUpdates.size >= 10
      ) {
        processBatch();
        lastBatchTime = currentTime;
      }
      break;
    }
    case "remove": {
      trailDataPool.free(command.objectId);
      lastPoints.delete(command.objectId);
      pendingUpdates.delete(command.objectId);
      break;
    }
    case "clear-all": {
      trailDataPool.clear();
      lastPoints.clear();
      pendingUpdates.clear();
      break;
    }
    case "set-max-points": {
      maxPointsToSend = command.maxPoints;
      break;
    }
  }
};

function processBatch(): void {
  if (pendingUpdates.size === 0) return;

  const results: Array<{
    objectId: string;
    points: [number, number, number][];
    maxHistoryLength: number;
  }> = [];

  // Process all pending updates
  for (const [objectId, position] of pendingUpdates) {
    // Ensure a slot is allocated for the object
    trailDataPool.allocate(objectId);

    // Add the new position directly to the ArrayBuffer
    trailDataPool.addPoint(objectId, position[0], position[1], position[2]);

    // Get only recent points to reduce data transfer
    const rawPoints = trailDataPool.getRecentPoints(objectId, maxPointsToSend);

    results.push({
      objectId,
      points: rawPoints,
      maxHistoryLength: trailDataPool.pointsPerSlot,
    });
  }

  // Send all results in a single message
  self.postMessage({
    type: "batch-results",
    results,
  });

  // Clear pending updates
  pendingUpdates.clear();
}
