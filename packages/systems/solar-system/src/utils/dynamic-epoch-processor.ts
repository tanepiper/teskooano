import {
  getCurrentEpoch,
  getJulianDayForEpoch,
  getEpochDifferenceYears,
  updateOrbitalElementsToEpoch,
  calculateCurrentPositionFromEpoch,
  ASTRONOMICAL_EPOCHS,
} from "@teskooano/core-physics";
import type { CelestialObject } from "@teskooano/data-types";

/**
 * Processes celestial objects to calculate their current positions based on today's date.
 * This system intelligently handles different epoch types and converts them to current positions.
 */
export class DynamicEpochProcessor {
  private todayEpoch: string;
  private processedObjects: Map<
    string,
    { originalEpoch: string; currentEpoch: string; yearsDifference: number }
  > = new Map();

  constructor() {
    this.todayEpoch = getCurrentEpoch();
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
   */
  private processObject<T>(object: CelestialObject<T>): CelestialObject<T> {
    // Skip objects without orbital elements (like the Sun)
    if (!object.orbit) {
      return object;
    }

    const originalEpoch = object.orbit.epoch;

    // Skip if already at current epoch
    if (originalEpoch === this.todayEpoch) {
      return object;
    }

    const yearsDifference = getEpochDifferenceYears(
      originalEpoch,
      this.todayEpoch,
    );

    // Store processing information for logging
    this.processedObjects.set(object.name, {
      originalEpoch,
      currentEpoch: this.todayEpoch,
      yearsDifference,
    });

    // Calculate the actual current position and updated orbital elements
    const { position, velocity, updatedOrbitalElements } =
      calculateCurrentPositionFromEpoch(object.orbit, this.todayEpoch);

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
    todayEpoch: string;
    epochTypes: Record<string, number>;
    averageYearsDifference: number;
    maxYearsDifference: number;
    objectsWithLargeDifferences: Array<{
      name: string;
      yearsDifference: number;
      originalEpoch: string;
    }>;
  } {
    const epochTypes: Record<string, number> = {};
    let totalYearsDifference = 0;
    let maxYearsDifference = 0;
    const objectsWithLargeDifferences: Array<{
      name: string;
      yearsDifference: number;
      originalEpoch: string;
    }> = [];

    this.processedObjects.forEach((info, name) => {
      // Count epoch types
      epochTypes[info.originalEpoch] =
        (epochTypes[info.originalEpoch] || 0) + 1;

      // Track year differences
      totalYearsDifference += Math.abs(info.yearsDifference);
      if (Math.abs(info.yearsDifference) > maxYearsDifference) {
        maxYearsDifference = Math.abs(info.yearsDifference);
      }

      // Flag objects with large time differences
      if (Math.abs(info.yearsDifference) > 25) {
        objectsWithLargeDifferences.push({
          name,
          yearsDifference: info.yearsDifference,
          originalEpoch: info.originalEpoch,
        });
      }
    });

    return {
      totalObjects: this.processedObjects.size,
      todayEpoch: this.todayEpoch,
      epochTypes,
      averageYearsDifference: totalYearsDifference / this.processedObjects.size,
      maxYearsDifference,
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
    julianDayDifference: number;
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
      if (info.currentEpoch !== this.todayEpoch) {
        issues.push({
          objectName: name,
          issue: `Not processed to current epoch. Expected: ${this.todayEpoch}, Got: ${info.currentEpoch}`,
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
