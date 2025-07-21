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
    console.log(
      `🔄 Processing ${objects.length} objects to current epoch: ${this.todayEpoch}`,
    );

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
      console.log(`⏭️  ${object.name}: Skipped (no orbital elements)`);
      return object;
    }

    const originalEpoch = object.orbit.epoch;

    // Skip if already at current epoch
    if (originalEpoch === this.todayEpoch) {
      console.log(
        `✅ ${object.name}: Already at current epoch (${this.todayEpoch})`,
      );
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

    // Log the position change for debugging
    console.log(
      `📍 ${object.name}: Current position calculated from ${originalEpoch} epoch data`,
    );
    console.log(`   Reference epoch: ${originalEpoch} (preserved)`);
    console.log(
      `   Original mean anomaly: ${object.orbit.meanAnomaly.toFixed(3)} rad`,
    );
    console.log(
      `   Updated mean anomaly: ${updatedOrbitalElements.meanAnomaly.toFixed(3)} rad`,
    );
    console.log(
      `   Current position: (${position.x.toFixed(0)}, ${position.y.toFixed(0)}, ${position.z.toFixed(0)}) m`,
    );
    console.log(
      `   Velocity: (${velocity.x.toFixed(0)}, ${velocity.y.toFixed(0)}, ${velocity.z.toFixed(0)}) m/s`,
    );
    console.log(`   Time difference: ${yearsDifference.toFixed(1)} years`);

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

    console.log("\n📊 Dynamic Epoch Processing Summary");
    console.log("==================================");
    console.log(`📅 Current Date: ${stats.todayEpoch}`);
    console.log(`🔢 Total Objects: ${stats.totalObjects}`);
    console.log(
      `📈 Average Years Difference: ${stats.averageYearsDifference.toFixed(1)} years`,
    );
    console.log(
      `📊 Maximum Years Difference: ${stats.maxYearsDifference.toFixed(1)} years`,
    );

    console.log("\n📋 Epoch Distribution:");
    Object.entries(stats.epochTypes)
      .sort(([, a], [, b]) => b - a)
      .forEach(([epoch, count]) => {
        const percentage = ((count / stats.totalObjects) * 100).toFixed(1);
        console.log(`  ${epoch}: ${count} objects (${percentage}%)`);
      });

    if (stats.objectsWithLargeDifferences.length > 0) {
      console.log("\n⚠️  Objects with Large Time Differences (>25 years):");
      stats.objectsWithLargeDifferences
        .sort(
          (a, b) => Math.abs(b.yearsDifference) - Math.abs(a.yearsDifference),
        )
        .forEach((obj) => {
          console.log(
            `  - ${obj.name}: ${obj.yearsDifference.toFixed(1)} years (${obj.originalEpoch} → ${stats.todayEpoch})`,
          );
        });
    }

    console.log("==================================\n");
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
