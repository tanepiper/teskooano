import { standardizeToCurrentEpoch } from "@teskooano/core-physics";
import type { CelestialObject } from "@teskooano/data-types";

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
 * Validates that all celestial objects in a solar system use the same epoch.
 * This is useful for ensuring consistency across the entire system.
 *
 * @param objects - Array of celestial objects to validate
 * @returns Object with validation results
 */
export function validateEpochConsistency<T>(objects: CelestialObject<T>[]): {
  isConsistent: boolean;
  epochs: Set<string>;
  inconsistentObjects: Array<{ name: string; epoch: string }>;
} {
  const epochs = new Set<string>();
  const inconsistentObjects: Array<{ name: string; epoch: string }> = [];

  objects.forEach((object) => {
    epochs.add(object.orbit.epoch);
  });

  // If more than one epoch is found, identify inconsistent objects
  if (epochs.size > 1) {
    const mostCommonEpoch = Array.from(epochs).reduce((prev, current) => {
      const prevCount = objects.filter(
        (obj) => obj.orbit.epoch === prev,
      ).length;
      const currentCount = objects.filter(
        (obj) => obj.orbit.epoch === current,
      ).length;
      return currentCount > prevCount ? current : prev;
    });

    objects.forEach((object) => {
      if (object.orbit.epoch !== mostCommonEpoch) {
        inconsistentObjects.push({
          name: object.name,
          epoch: object.orbit.epoch,
        });
      }
    });
  }

  return {
    isConsistent: epochs.size <= 1,
    epochs,
    inconsistentObjects,
  };
}

/**
 * Gets a summary of epoch usage across all celestial objects.
 * Useful for debugging and ensuring data consistency.
 *
 * @param objects - Array of celestial objects to analyze
 * @returns Summary of epoch distribution
 */
export function getEpochSummary<T>(objects: CelestialObject<T>[]): {
  totalObjects: number;
  epochCounts: Record<string, number>;
  epochBreakdown: Array<{ epoch: string; count: number; percentage: number }>;
} {
  const epochCounts: Record<string, number> = {};

  objects.forEach((object) => {
    const epoch = object.orbit.epoch;
    epochCounts[epoch] = (epochCounts[epoch] || 0) + 1;
  });

  const totalObjects = objects.length;
  const epochBreakdown = Object.entries(epochCounts).map(([epoch, count]) => ({
    epoch,
    count,
    percentage: (count / totalObjects) * 100,
  }));

  return {
    totalObjects,
    epochCounts,
    epochBreakdown,
  };
}

/**
 * Logs epoch information for debugging purposes.
 * This helps identify which objects need epoch updates.
 *
 * @param objects - Array of celestial objects to log
 */
export function logEpochInformation<T>(objects: CelestialObject<T>[]): void {
  const summary = getEpochSummary(objects);
  const validation = validateEpochConsistency(objects);

  console.log("=== Solar System Epoch Analysis ===");
  console.log(`Total objects: ${summary.totalObjects}`);
  console.log(`Epochs found: ${summary.epochCounts}`);
  console.log(`Consistent: ${validation.isConsistent}`);

  if (!validation.isConsistent) {
    console.warn("⚠️  Inconsistent epochs detected:");
    validation.inconsistentObjects.forEach((obj) => {
      console.warn(`  - ${obj.name}: ${obj.epoch}`);
    });
  }

  console.log("Epoch breakdown:");
  summary.epochBreakdown.forEach(({ epoch, count, percentage }) => {
    console.log(`  ${epoch}: ${count} objects (${percentage.toFixed(1)}%)`);
  });
}
