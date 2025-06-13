import { CelestialObject, CelestialType } from "@teskooano/data-types";
import { RenderableCelestialObject } from "packages/renderer/threejs/src";

/**
 * Interface for LOD distance thresholds
 */
export interface LODDistances {
  closeDistance: number;
  mediumDistance: number;
  farDistance: number;
}

/**
 * Calculate LOD distances based on object type and radius
 */
export function calculateLODDistances(
  object: RenderableCelestialObject,
): LODDistances {
  const radius = object.radius || 1;

  let farDistance = radius * 1000;
  let mediumDistance = radius * 100;
  let closeDistance = radius * 10;

  switch (object.type) {
    case CelestialType.MOON:
      farDistance *= 0.5;
      mediumDistance *= 0.5;
      closeDistance *= 0.5;
      break;

    case CelestialType.SPACE_ROCK:
      farDistance *= 0.25;
      mediumDistance *= 0.25;
      closeDistance *= 0.25;
      break;

    case CelestialType.STAR:
      farDistance *= 2.0;
      mediumDistance *= 2.0;
      closeDistance *= 2.0;
      break;

    case CelestialType.GAS_GIANT:
      farDistance *= 3.0;
      mediumDistance *= 2.0;
      closeDistance *= 1.5;
      break;
  }

  return {
    closeDistance,
    mediumDistance,
    farDistance,
  };
}

/**
 * Get the number of detail segments for different LOD levels
 */
export function getDetailSegments(
  objectType: CelestialType,
  detailLevel: "high" | "medium" | "low" | "very-low",
): number {
  const segmentsByDetail = {
    high: 256,
    medium: 64,
    low: 16,
    "very-low": 8,
  };

  switch (objectType) {
    case CelestialType.PLANET:
    case CelestialType.GAS_GIANT:
      return {
        high: 256,
        medium: 128,
        low: 64,
        "very-low": 32,
      }[detailLevel];

    case CelestialType.MOON:
      return {
        high: 256,
        medium: 128,
        low: 64,
        "very-low": 32,
      }[detailLevel];

    case CelestialType.SPACE_ROCK:
      return {
        high: 64,
        medium: 32,
        low: 16,
        "very-low": 8,
      }[detailLevel];

    default:
      return segmentsByDetail[detailLevel];
  }
}
