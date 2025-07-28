import type { CelestialObject } from "@teskooano/data-types";
import {
  getJulianDayForEpoch,
  getCurrentPreciseEpoch,
} from "@teskooano/core-physics";

/**
 * Comprehensive shared utilities for epoch processing in the solar system.
 * This module consolidates common functionality used across different epoch processors.
 */

/**
 * Statistics about epoch processing across a collection of objects.
 */
export interface EpochProcessingStats {
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
}

/**
 * Results of epoch consistency validation.
 */
export interface EpochValidationResult {
  isConsistent: boolean;
  epochs: Set<string>;
  inconsistentObjects: Array<{ name: string; epoch: string }>;
  issues: Array<{ objectName: string; issue: string }>;
}

/**
 * Detailed epoch summary for analysis and debugging.
 */
export interface EpochSummary {
  totalObjects: number;
  epochCounts: Record<string, number>;
  epochBreakdown: Array<{
    epoch: string;
    count: number;
    percentage: number;
    julianDay: number;
    daysDifferenceFromCurrent: number;
  }>;
}

/**
 * Validates epoch consistency across all celestial objects.
 * Identifies objects using different epochs and potential accuracy issues.
 *
 * @param objects - Array of celestial objects to validate
 * @returns Comprehensive validation results including issues and inconsistencies
 */
export function validateEpochConsistency<T>(
  objects: CelestialObject<T>[],
): EpochValidationResult {
  const epochs = new Set<string>();
  const inconsistentObjects: Array<{ name: string; epoch: string }> = [];
  const issues: Array<{ objectName: string; issue: string }> = [];

  const currentJulianDay = getJulianDayForEpoch(getCurrentPreciseEpoch());

  // Collect all epochs and identify issues
  objects.forEach((object) => {
    if (!object.orbit) return;

    const epoch = object.orbit.epoch;
    epochs.add(epoch);

    // Check for very old epochs that might affect accuracy
    const epochJulianDay = getJulianDayForEpoch(epoch);
    const daysDifference = Math.abs(currentJulianDay - epochJulianDay);
    const yearsDifference = daysDifference / 365.25;

    if (yearsDifference > 50) {
      issues.push({
        objectName: object.name,
        issue: `Very old epoch (${yearsDifference.toFixed(1)} years old) may significantly affect accuracy`,
      });
    } else if (yearsDifference > 10) {
      issues.push({
        objectName: object.name,
        issue: `Old epoch (${yearsDifference.toFixed(1)} years old) may affect accuracy`,
      });
    }
  });

  // Find inconsistent objects if multiple epochs exist
  if (epochs.size > 1) {
    const mostCommonEpoch = Array.from(epochs).reduce((prev, current) => {
      const prevCount = objects.filter(
        (obj) => obj.orbit?.epoch === prev,
      ).length;
      const currentCount = objects.filter(
        (obj) => obj.orbit?.epoch === current,
      ).length;
      return currentCount > prevCount ? current : prev;
    });

    objects.forEach((object) => {
      if (object.orbit && object.orbit.epoch !== mostCommonEpoch) {
        inconsistentObjects.push({
          name: object.name,
          epoch: object.orbit.epoch,
        });
      }
    });
  }

  return {
    isConsistent: epochs.size <= 1 && issues.length === 0,
    epochs,
    inconsistentObjects,
    issues,
  };
}

/**
 * Generates comprehensive epoch statistics and analysis.
 * Provides detailed breakdown of epoch usage and time differences.
 *
 * @param objects - Array of celestial objects to analyze
 * @returns Detailed epoch summary with time difference analysis
 */
export function generateEpochSummary<T>(
  objects: CelestialObject<T>[],
): EpochSummary {
  const epochCounts: Record<string, number> = {};
  const currentJulianDay = getJulianDayForEpoch(getCurrentPreciseEpoch());

  objects.forEach((object) => {
    if (!object.orbit) return;
    const epoch = object.orbit.epoch;
    epochCounts[epoch] = (epochCounts[epoch] || 0) + 1;
  });

  const totalObjects = objects.filter((obj) => obj.orbit).length;

  const epochBreakdown = Object.entries(epochCounts).map(([epoch, count]) => {
    const julianDay = getJulianDayForEpoch(epoch);
    const daysDifferenceFromCurrent = currentJulianDay - julianDay;

    return {
      epoch,
      count,
      percentage: (count / totalObjects) * 100,
      julianDay,
      daysDifferenceFromCurrent,
    };
  });

  // Sort by count (most common first)
  epochBreakdown.sort((a, b) => b.count - a.count);

  return {
    totalObjects,
    epochCounts,
    epochBreakdown,
  };
}

/**
 * Calculates processing statistics from a map of processed object information.
 * Used by epoch processors to generate comprehensive statistics.
 *
 * @param processedObjects - Map of object names to processing information
 * @returns Complete processing statistics
 */
export function calculateProcessingStats(
  processedObjects: Map<
    string,
    {
      originalEpoch: string;
      currentEpoch: string;
      yearsDifference: number;
      timeDifferenceSeconds: number;
    }
  >,
): EpochProcessingStats {
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

  processedObjects.forEach((info, name) => {
    // Count epoch types
    epochTypes[info.originalEpoch] = (epochTypes[info.originalEpoch] || 0) + 1;

    // Track time differences
    const absYearsDiff = Math.abs(info.yearsDifference);
    totalYearsDifference += absYearsDiff;
    totalTimeDifferenceSeconds += Math.abs(info.timeDifferenceSeconds);

    if (absYearsDiff > maxYearsDifference) {
      maxYearsDifference = absYearsDiff;
    }

    // Flag objects with large time differences (more than 1 year)
    if (absYearsDiff > 1) {
      objectsWithLargeDifferences.push({
        name,
        yearsDifference: info.yearsDifference,
        timeDifferenceSeconds: info.timeDifferenceSeconds,
        originalEpoch: info.originalEpoch,
      });
    }
  });

  return {
    totalObjects: processedObjects.size,
    currentEpoch: getCurrentPreciseEpoch(),
    epochTypes,
    averageYearsDifference: totalYearsDifference / processedObjects.size,
    maxYearsDifference,
    averageTimeDifferenceSeconds:
      totalTimeDifferenceSeconds / processedObjects.size,
    objectsWithLargeDifferences: objectsWithLargeDifferences.sort(
      (a, b) => Math.abs(b.yearsDifference) - Math.abs(a.yearsDifference),
    ),
  };
}

/**
 * Logs comprehensive epoch analysis information to the console.
 * Provides detailed debugging information about epoch processing.
 *
 * @param objects - Array of celestial objects to analyze
 * @param title - Optional title for the log output
 */
export function logEpochAnalysis<T>(
  objects: CelestialObject<T>[],
  title: string = "Solar System Epoch Analysis",
): void {
  const summary = generateEpochSummary(objects);
  const validation = validateEpochConsistency(objects);

  console.log(`=== ${title} ===`);
  console.log(`📊 Total objects with orbits: ${summary.totalObjects}`);
  console.log(`🎯 Current epoch: ${getCurrentPreciseEpoch()}`);
  console.log(`📅 Unique epochs found: ${validation.epochs.size}`);
  console.log(`✅ Consistent: ${validation.isConsistent}`);

  if (!validation.isConsistent) {
    console.warn("⚠️  Issues detected:");
    validation.issues.forEach((issue) => {
      console.warn(`  - ${issue.objectName}: ${issue.issue}`);
    });

    if (validation.inconsistentObjects.length > 0) {
      console.warn("🔄 Inconsistent epochs:");
      validation.inconsistentObjects.forEach((obj) => {
        console.warn(`  - ${obj.name}: ${obj.epoch}`);
      });
    }
  }

  console.log("📈 Epoch breakdown:");
  summary.epochBreakdown.forEach(
    ({ epoch, count, percentage, daysDifferenceFromCurrent }) => {
      const yearsOld = (daysDifferenceFromCurrent / 365.25).toFixed(1);
      const status = Math.abs(daysDifferenceFromCurrent) > 365 ? "⚠️" : "✅";
      console.log(
        `  ${status} ${epoch}: ${count} objects (${percentage.toFixed(1)}%) - ${yearsOld} years old`,
      );
    },
  );
}

/**
 * Logs processing statistics from epoch processing operations.
 * Shows detailed information about time differences and processing results.
 *
 * @param stats - Processing statistics to log
 * @param title - Optional title for the log output
 */
export function logProcessingStats(
  stats: EpochProcessingStats,
  title: string = "Epoch Processing Results",
): void {
  console.log(`=== ${title} ===`);
  console.log(`📊 Objects processed: ${stats.totalObjects}`);
  console.log(
    `⏱️  Average time difference: ${stats.averageYearsDifference.toFixed(2)} years`,
  );
  console.log(
    `📈 Maximum time difference: ${stats.maxYearsDifference.toFixed(2)} years`,
  );

  if (stats.objectsWithLargeDifferences.length > 0) {
    console.warn(
      `⚠️  Objects with >1 year difference (${stats.objectsWithLargeDifferences.length}):`,
    );
    stats.objectsWithLargeDifferences.slice(0, 5).forEach((obj) => {
      console.warn(
        `  - ${obj.name}: ${obj.yearsDifference.toFixed(1)} years (${obj.originalEpoch})`,
      );
    });
    if (stats.objectsWithLargeDifferences.length > 5) {
      console.warn(
        `  ... and ${stats.objectsWithLargeDifferences.length - 5} more`,
      );
    }
  }

  console.log("📅 Original epoch distribution:");
  Object.entries(stats.epochTypes)
    .sort(([, a], [, b]) => b - a)
    .forEach(([epoch, count]) => {
      const percentage = ((count / stats.totalObjects) * 100).toFixed(1);
      console.log(`  - ${epoch}: ${count} objects (${percentage}%)`);
    });
}
