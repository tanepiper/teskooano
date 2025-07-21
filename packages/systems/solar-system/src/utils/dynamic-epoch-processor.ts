import {
  getCurrentEpoch,
  getCurrentPreciseEpoch,
  getCurrentJulianDay,
  getJulianDayForEpoch,
  getEpochDifferenceYears,
  updateOrbitalElementsToEpoch,
  calculateCurrentPositionFromEpoch,
  calculateCurrentPositionPrecise,
  J2000_EPOCH,
} from "@teskooano/core-physics";
import type { CelestialObject } from "@teskooano/data-types";

/**
 * Processes celestial objects to calculate their current positions based on the actual current time.
 * This system intelligently handles different epoch types and converts them to current positions
 * using precise time calculations for maximum accuracy.
 */
export class DynamicEpochProcessor {
  private currentJulianDay: number;
  private currentPreciseEpoch: string;
  private processedObjects: Map<
    string,
    {
      originalEpoch: string;
      currentEpoch: string;
      yearsDifference: number;
      timeDifferenceSeconds: number;
      isPreciseCalculation: boolean;
    }
  > = new Map();

  constructor() {
    this.currentJulianDay = getCurrentJulianDay();
    this.currentPreciseEpoch = getCurrentPreciseEpoch();
  }

  /**
   * Processes all celestial objects to calculate their current positions.
   * This is the main entry point for dynamic epoch processing.
   */
  processObjects<T>(objects: CelestialObject<T>[]): CelestialObject<T>[] {
    const processedObjects = objects.map((object) =>
      this.processObject(object),
    );

    this.logProcessingSummary();
    return processedObjects;
  }

  /**
   * Processes a single celestial object to calculate its current position.
   * Uses precise time calculations for maximum accuracy.
   */
  private processObject<T>(object: CelestialObject<T>): CelestialObject<T> {
    // Skip objects without orbital elements (like the Sun)
    if (!object.orbit) {
      return object;
    }

    const originalEpoch = object.orbit.epoch;
    const epochJulianDay = getJulianDayForEpoch(originalEpoch);

    // Calculate time difference in seconds for precise positioning
    const daysDifference = this.currentJulianDay - epochJulianDay;
    const timeDifferenceSeconds = daysDifference * 24 * 3600;

    // Store processing information for logging
    this.processedObjects.set(object.name, {
      originalEpoch,
      currentEpoch: this.currentPreciseEpoch,
      yearsDifference: daysDifference / 365.25,
      timeDifferenceSeconds,
      isPreciseCalculation: true,
    });

    // Use precise calculation for all objects to ensure maximum accuracy
    const { position, velocity, updatedOrbitalElements } =
      calculateCurrentPositionPrecise(object.orbit);

    return {
      ...object,
      orbit: updatedOrbitalElements,
    };
  }

  /**
   * Gets processing statistics for all objects.
   */
  getProcessingStats(): {
    totalObjects: number;
    currentEpoch: string;
    epochTypes: Record<string, number>;
    averageYearsDifference: number;
    maxYearsDifference: number;
    averageTimeDifferenceSeconds: number;
    objectsWithLargeDifferences: Array<{
      name: string;
      yearsDifference: number;
      timeDifferenceSeconds: number;
      originalEpoch: string;
    }>;
  } {
    const epochTypes: Record<string, number> = {};
    let totalYearsDifference = 0;
    let totalTimeDifferenceSeconds = 0;
    let maxYearsDifference = 0;
    const objectsWithLargeDifferences: Array<{
      name: string;
      yearsDifference: number;
      timeDifferenceSeconds: number;
      originalEpoch: string;
    }> = [];

    this.processedObjects.forEach((info, name) => {
      // Count epoch types
      epochTypes[info.originalEpoch] =
        (epochTypes[info.originalEpoch] || 0) + 1;

      // Track time differences
      totalYearsDifference += Math.abs(info.yearsDifference);
      totalTimeDifferenceSeconds += Math.abs(info.timeDifferenceSeconds);
      if (Math.abs(info.yearsDifference) > maxYearsDifference) {
        maxYearsDifference = Math.abs(info.yearsDifference);
      }

      // Flag objects with large time differences (more than 1 year)
      if (Math.abs(info.yearsDifference) > 1) {
        objectsWithLargeDifferences.push({
          name,
          yearsDifference: info.yearsDifference,
          timeDifferenceSeconds: info.timeDifferenceSeconds,
          originalEpoch: info.originalEpoch,
        });
      }
    });

    return {
      totalObjects: this.processedObjects.size,
      currentEpoch: this.currentPreciseEpoch,
      epochTypes,
      averageYearsDifference: totalYearsDifference / this.processedObjects.size,
      maxYearsDifference,
      averageTimeDifferenceSeconds:
        totalTimeDifferenceSeconds / this.processedObjects.size,
      objectsWithLargeDifferences,
    };
  }

  /**
   * Logs a detailed summary of the epoch processing.
   */
  private logProcessingSummary(): void {
    const stats = this.getProcessingStats();

    Object.entries(stats.epochTypes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([epoch, count]) => {
        const percentage = ((count / stats.totalObjects) * 100).toFixed(1);
      });

    if (stats.objectsWithLargeDifferences.length > 0) {
      stats.objectsWithLargeDifferences.sort(
        (a, b) => Math.abs(b.yearsDifference) - Math.abs(a.yearsDifference),
      );
    }
  }

  /**
   * Gets detailed information about a specific object's epoch processing.
   */
  getObjectInfo(objectName: string): {
    originalEpoch: string;
    currentEpoch: string;
    yearsDifference: number;
    timeDifferenceSeconds: number;
    julianDayDifference: number;
    isPreciseCalculation: boolean;
  } | null {
    const info = this.processedObjects.get(objectName);
    if (!info) return null;

    const julianDayDifference =
      getJulianDayForEpoch(info.currentEpoch) -
      getJulianDayForEpoch(info.originalEpoch);

    return {
      ...info,
      julianDayDifference,
    };
  }

  /**
   * Validates that all objects have been processed to the current epoch.
   */
  validateProcessing(): {
    isValid: boolean;
    issues: Array<{ objectName: string; issue: string }>;
  } {
    const issues: Array<{ objectName: string; issue: string }> = [];

    this.processedObjects.forEach((info, name) => {
      if (info.currentEpoch !== this.currentPreciseEpoch) {
        issues.push({
          objectName: name,
          issue: `Not processed to current epoch. Expected: ${this.currentPreciseEpoch}, Got: ${info.currentEpoch}`,
        });
      }

      if (Math.abs(info.yearsDifference) > 100) {
        issues.push({
          objectName: name,
          issue: `Very large time difference (${info.yearsDifference.toFixed(1)} years) may affect accuracy`,
        });
      }
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

/**
 * Convenience function to process all solar system objects to current positions.
 * This is the main entry point for dynamic epoch processing.
 */
export function processSolarSystemToCurrentPositions<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[] {
  const processor = new DynamicEpochProcessor();
  return processor.processObjects(objects);
}

/**
 * Processes all solar system objects to their current positions using precise time calculations.
 * This ensures maximum accuracy for all objects, especially satellites and fast-moving bodies.
 *
 * @param objects - Array of celestial objects to process
 * @returns Array of objects with updated orbital elements reflecting current positions
 */
export function processSolarSystemToCurrentTime<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[] {
  const processor = new DynamicEpochProcessor();
  const processedObjects = processor.processObjects(objects);

  // Log the processing results for debugging
  const stats = processor.getProcessingStats();
  console.log(
    `[DynamicEpochProcessor] Processed ${stats.totalObjects} objects to current time: ${stats.currentEpoch}`,
  );
  console.log(
    `[DynamicEpochProcessor] Average time difference: ${(stats.averageTimeDifferenceSeconds / 3600).toFixed(2)} hours`,
  );

  if (stats.objectsWithLargeDifferences.length > 0) {
    console.log(`[DynamicEpochProcessor] Objects with large time differences:`);
    stats.objectsWithLargeDifferences.forEach((obj) => {
      console.log(
        `  - ${obj.name}: ${obj.yearsDifference.toFixed(2)} years (${(obj.timeDifferenceSeconds / 3600).toFixed(2)} hours)`,
      );
    });
  }

  return processedObjects;
}
