import {
  calculateCurrentPositionPrecise,
  getCurrentJulianDay,
  getCurrentPreciseEpoch,
  getJulianDayForEpoch,
} from "@teskooano/core-physics";
import type { CelestialObject } from "@teskooano/data-types";
import {
  calculateProcessingStats,
  logProcessingStats,
  EpochProcessingStats,
} from "./epoch-utilities";

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
   * Gets processing statistics for all objects using shared utilities.
   */
  getProcessingStats(): EpochProcessingStats {
    return calculateProcessingStats(this.processedObjects);
  }

  /**
   * Logs a detailed summary of the epoch processing using shared utilities.
   */
  private logProcessingSummary(): void {
    const stats = this.getProcessingStats();
    logProcessingStats(stats, "Dynamic Epoch Processing Results");
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
   * Validates that all objects have been processed correctly.
   * Checks for epoch consistency and potential accuracy issues.
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

      const absYearsDiff = Math.abs(info.yearsDifference);
      if (absYearsDiff > 100) {
        issues.push({
          objectName: name,
          issue: `Very large time difference (${absYearsDiff.toFixed(1)} years) may significantly affect accuracy`,
        });
      } else if (absYearsDiff > 50) {
        issues.push({
          objectName: name,
          issue: `Large time difference (${absYearsDiff.toFixed(1)} years) may affect accuracy`,
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

  return processedObjects;
}
