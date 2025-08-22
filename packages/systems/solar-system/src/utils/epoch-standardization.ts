import { standardizeToCurrentEpoch } from "@teskooano/core-physics";
import type { CelestialObject } from "@teskooano/data-types";
import { generateEpochSummary, logEpochAnalysis } from "./epoch-utilities";

/**
 * Standardizes all celestial objects in a solar system to the current epoch.
 * This ensures that all orbital elements are consistent and up-to-date for
 * accurate positioning in the simulation.
 *
 * @param objects - Array of celestial objects to standardize
 * @returns New array with standardized orbital elements
 */
export function standardizeSolarSystemEpochs<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[] {
  return objects.map((object) => ({
    ...object,
    orbit: standardizeToCurrentEpoch(object.orbit),
  }));
}

/**
 * Gets a summary of epoch usage across all celestial objects.
 * Useful for debugging and ensuring data consistency.
 *
 * @deprecated Use generateEpochSummary from epoch-utilities instead
 * @param objects - Array of celestial objects to analyze
 * @returns Summary of epoch distribution
 */
export function getEpochSummary<T>(objects: CelestialObject<T>[]): {
  totalObjects: number;
  epochCounts: Record<string, number>;
  epochBreakdown: Array<{ epoch: string; count: number; percentage: number }>;
} {
  const result = generateEpochSummary(objects);
  return {
    totalObjects: result.totalObjects,
    epochCounts: result.epochCounts,
    epochBreakdown: result.epochBreakdown.map((item) => ({
      epoch: item.epoch,
      count: item.count,
      percentage: item.percentage,
    })),
  };
}

/**
 * Logs epoch information for debugging purposes.
 * This helps identify which objects need epoch updates.
 *
 * @deprecated Use logEpochAnalysis from epoch-utilities instead
 * @param objects - Array of celestial objects to log
 */
export function logEpochInformation<T>(objects: CelestialObject<T>[]): void {
  logEpochAnalysis(objects, "Solar System Epoch Analysis (Legacy)");
}
