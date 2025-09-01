import { getCurrentPreciseEpoch } from "@teskooano/core-math";
import type { CelestialObject } from "@teskooano/data-types";

/**
 * Sets all celestial objects in a procedurally generated system to the current epoch.
 * This ensures that all objects have consistent, up-to-date epoch information
 * for accurate positioning in the simulation.
 *
 * @param objects - Array of celestial objects to update
 * @returns New array with all objects updated to current epoch
 */
export function setSystemToCurrentEpoch<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[] {
  const currentEpoch = getCurrentPreciseEpoch();

  return objects.map((object) => {
    // Skip objects without orbital elements (like stars)
    if (!object.orbit) {
      return object;
    }

    // Update the epoch to current time
    return {
      ...object,
      orbit: {
        ...object.orbit,
        epoch: currentEpoch,
      },
    };
  });
}

/**
 * Gets the current epoch string for use in procedural generation.
 * This provides a consistent reference time for all generated objects.
 *
 * @returns Current epoch string in YYYY-MM-DDTHH:MM:SS format
 */
export function getCurrentEpochForGeneration(): string {
  return getCurrentPreciseEpoch();
}

/**
 * Validates that all celestial objects in a system use the same epoch.
 * This is useful for ensuring consistency in procedurally generated systems.
 *
 * @param objects - Array of celestial objects to validate
 * @returns True if all objects use the same epoch, false otherwise
 */
export function validateSystemEpochConsistency<T>(
  objects: CelestialObject<T>[],
): boolean {
  const epochs = new Set<string>();

  objects.forEach((object) => {
    if (object.orbit?.epoch) {
      epochs.add(object.orbit.epoch);
    }
  });

  // All objects should use the same epoch (or no epoch for non-orbital objects)
  return epochs.size <= 1;
}

/**
 * Logs epoch information for a procedurally generated system.
 * Useful for debugging and ensuring epoch consistency.
 *
 * @param objects - Array of celestial objects to analyze
 * @param systemName - Name of the system for logging context
 */
export function logSystemEpochInfo<T>(
  objects: CelestialObject<T>[],
  systemName: string = "Procedurally Generated System",
): void {
  const currentEpoch = getCurrentEpochForGeneration();
  const orbitalObjects = objects.filter((obj) => obj.orbit);
  const nonOrbitalObjects = objects.filter((obj) => !obj.orbit);

  console.log(`=== ${systemName} Epoch Information ===`);
  console.log(`🎯 Current epoch: ${currentEpoch}`);
  console.log(`📊 Total objects: ${objects.length}`);
  console.log(`🪐 Objects with orbits: ${orbitalObjects.length}`);
  console.log(`⭐ Objects without orbits: ${nonOrbitalObjects.length}`);

  if (orbitalObjects.length > 0) {
    const isConsistent = validateSystemEpochConsistency(objects);
    console.log(`✅ Epoch consistent: ${isConsistent}`);

    if (isConsistent) {
      const sampleEpoch = orbitalObjects[0]?.orbit?.epoch;
      console.log(`📅 All orbital objects use epoch: ${sampleEpoch}`);
    } else {
      console.warn(
        "⚠️  Multiple epochs detected - this may cause positioning issues",
      );
    }
  }
}
