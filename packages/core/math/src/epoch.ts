/**
 * Comprehensive epoch utilities for astronomical calculations.
 * This module provides functions for epoch validation, analysis, and processing.
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
 * Gets the current date as an epoch string (YYYY-MM-DD format).
 * This represents today's actual date for dynamic position calculations.
 */
export function getCurrentEpoch(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets the current date and time as a precise epoch string (YYYY-MM-DDTHH:MM:SS format).
 * This provides more accurate positioning for objects that move quickly (like satellites).
 */
export function getCurrentPreciseEpoch(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/**
 * Gets the current Julian Day number with time precision.
 * This is the most accurate way to represent the current moment.
 */
export function getCurrentJulianDay(): number {
  const now = new Date();
  return dateToJulianDay(now);
}

/**
 * J2000 epoch as the standard astronomical reference.
 * This is the only hard-coded epoch we keep as it's the international standard.
 */
export const J2000_EPOCH = "J2000";

/**
 * Julian Day number for J2000 epoch.
 * Julian Day is a continuous count of days since January 1, 4713 BC.
 */
export const J2000_JULIAN_DAY = 2451545.0; // January 1, 2000 12:00:00 UTC

/**
 * Converts a date to Julian Day number.
 * Uses the standard astronomical formula for Julian Day calculation.
 */
export function dateToJulianDay(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  // Astronomical Julian Day calculation
  let jd =
    367 * year -
    Math.floor((7 * (year + Math.floor((month + 9) / 12))) / 4) +
    Math.floor((275 * month) / 9) +
    day +
    1721013.5 +
    hour / 24 +
    minute / 1440 +
    second / 86400;

  return jd;
}

/**
 * Converts Julian Day to years since J2000 epoch.
 */
export function julianDayToYearsSinceJ2000(julianDay: number): number {
  return (julianDay - J2000_JULIAN_DAY) / 365.25;
}

/**
 * Converts years since J2000 to Julian Day.
 */
export function yearsSinceJ2000ToJulianDay(years: number): number {
  return J2000_JULIAN_DAY + years * 365.25;
}

/**
 * Converts an epoch string to Julian Day number.
 * Supports multiple epoch formats:
 * - J2000, J2025, etc. (Julian epoch format)
 * - JD 2451545.0, JD2460675.0 (Julian Day format)
 * - 2451545.0, 2460675.0 (numeric Julian Day)
 * - 2025-05-05 (ISO date format)
 * - 2025-05-05T12:30:45 (ISO datetime format)
 */
export function getJulianDayForEpoch(epoch: string): number {
  // Handle Julian epoch format (J2000, J2025, etc.)
  if (epoch.startsWith("J") && epoch.length > 1) {
    const year = parseInt(epoch.substring(1));
    if (!isNaN(year)) {
      // J2000 = 2451545.0, each year adds 365.25 days
      return J2000_JULIAN_DAY + (year - 2000) * 365.25;
    }
  }

  // Handle Julian Day format (JD 2451545.0, JD2460675.0)
  if (epoch.startsWith("JD")) {
    const jd = parseFloat(epoch.substring(2).trim());
    if (!isNaN(jd)) {
      return jd;
    }
  }

  // Handle numeric Julian Day (2451545.0, 2460675.0)
  const numericJd = parseFloat(epoch);
  if (!isNaN(numericJd)) {
    return numericJd;
  }

  // Handle ISO date format (2025-05-05, 2025-05-05T12:30:45)
  try {
    const date = new Date(epoch);
    if (!isNaN(date.getTime())) {
      return dateToJulianDay(date);
    }
  } catch {
    // Invalid date format
  }

  // Fallback to J2000 for unknown formats
  console.warn(`Unknown epoch format: ${epoch}, using J2000 as fallback`);
  return J2000_JULIAN_DAY;
}

/**
 * Validates epoch consistency across all celestial objects.
 * Identifies objects using different epochs and potential accuracy issues.
 *
 * @param objects - Array of celestial objects to validate
 * @returns Comprehensive validation results including issues and inconsistencies
 */
export function validateEpochConsistency<T>(
  objects: Array<{ name: string; orbit?: { epoch: string } }>,
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
  objects: Array<{ orbit?: { epoch: string } }>,
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
  objects: Array<{ name: string; orbit?: { epoch: string } }>,
  title: string = "Epoch Analysis",
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
