import { CircularBuffer } from "../utils/CircularBuffer";
import { OSVector3 } from "@teskooano/core-math";
import { simplifyPath } from "../utils/simplify";
import { catmullRomSpline } from "../utils/spline";

type TrailCommand =
  | {
      type: "update";
      objectId: string;
      position: [number, number, number];
      maxHistoryLength: number;
      quality: string;
    }
  | { type: "set-history-limit"; maxHistoryLength: number }
  | { type: "remove"; objectId: string }
  | { type: "clear-all" };

const positionHistory: Map<string, CircularBuffer<OSVector3>> = new Map();
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
      let history = positionHistory.get(objectId);

      // Initialize history for a new object
      if (!history) {
        history = new CircularBuffer<OSVector3>(maxHistoryLength);
        positionHistory.set(objectId, history);
      }

      // Ensure the buffer has the correct capacity
      if (history.capacity !== maxHistoryLength) {
        history.resize(maxHistoryLength);
      }

      // Add the new position, rehydrating it into an OSVector3
      history.push(new OSVector3(position[0], position[1], position[2]));

      const allPoints = history.getOrderedItems();
      let pointsToRender = allPoints;

      // Simplify and smooth the path for rendering if over the threshold
      if (allPoints.length > SIMPLIFICATION_THRESHOLD) {
        const simplifiedPoints = simplifyPath(
          allPoints,
          SIMPLIFICATION_EPSILON,
        );
        // Further smooth the simplified path
        if (simplifiedPoints.length > 2) {
          const budget = qualityToBudget[quality] || 250000; // Default to High
          pointsToRender = catmullRomSpline(simplifiedPoints, budget);
        } else {
          pointsToRender = simplifiedPoints;
        }
      }

      // Send the updated points back to the main thread for rendering
      const points = pointsToRender.map(
        (p) => [p.x, p.y, p.z] as [number, number, number],
      );

      self.postMessage({
        objectId,
        points,
        maxHistoryLength,
      });

      break;
    }
    case "set-history-limit": {
      const { maxHistoryLength } = command;
      positionHistory.forEach((buffer) => buffer.resize(maxHistoryLength));
      break;
    }
    case "remove": {
      positionHistory.delete(command.objectId);
      break;
    }
    case "clear-all": {
      positionHistory.clear();
      break;
    }
  }
};
