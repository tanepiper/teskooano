import { OSVector3 } from "@teskooano/core-math";
import { calculateKeplerianStateAtTime } from "@teskooano/core-physics";
import { StateAccessor } from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
} from "@teskooano/data-types";

export interface DateCalculationResult {
  objectId: string;
  position: OSVector3;
  velocity: OSVector3;
  updatedOrbitalElements: any; // The updated orbital elements for the target date
}

export interface DateCalculationResponse {
  results: DateCalculationResult[];
  objectsToRemove: string[];
}

/**
 * Simplified date calculator that works with our existing physics engine.
 * Calculates positions for all celestial objects at a target date without
 * dealing with complex epoch logic.
 */
export class SimpleDateCalculator {
  /**
   * Calculates the positions of all celestial objects for a specific date
   * using our existing physics engine.
   *
   * @param targetDate - The date to calculate positions for
   * @param celestialObjects - Map of all celestial objects
   * @returns Array of calculated positions and updated orbital elements
   */
  public static calculatePositionsForDate(
    targetDate: Date,
    celestialObjects: Record<string, CelestialObject>,
  ): DateCalculationResponse {
    const results: DateCalculationResult[] = [];
    const objectsToRemove: string[] = [];

    console.log(
      `[SimpleDateCalculator] Calculating positions for ${targetDate.toISOString()}`,
    );

    // Process each object
    Object.values(celestialObjects).forEach((object) => {
      if (object.status !== CelestialStatus.ACTIVE) {
        console.log(
          `[SimpleDateCalculator] Skipping ${object.id} - status: ${object.status}`,
        );
        return;
      }

      // Skip objects without orbital elements (like the Sun)
      if (!object.orbit) {
        console.log(
          `[SimpleDateCalculator] Skipping ${object.id} - no orbital elements`,
        );
        return;
      }

      // Check if this object should exist at the target date
      if (
        object.type === CelestialType.SATELLITE ||
        object.type === CelestialType.COMET
      ) {
        const earliestDate =
          (object.properties as any)?.launchDate ||
          (object.properties as any)?.discoveredDate;
        if (earliestDate) {
          const earliestDateTime = new Date(earliestDate).getTime();
          const targetDateTime = targetDate.getTime();

          if (targetDateTime < earliestDateTime) {
            console.log(
              `[SimpleDateCalculator] Removing ${object.id} (${object.type}) - target date ${targetDate.toISOString()} is before launch date ${earliestDate}`,
            );
            objectsToRemove.push(object.id);
            return;
          }
        }
      }

      try {
        // Get current simulation state to calculate time difference
        const currentSimulationState =
          StateAccessor.getCurrentSimulationState();
        const currentEffectiveDate = new Date(
          currentSimulationState.startDate.getTime() +
            currentSimulationState.time * 1000,
        );

        // Calculate time difference from current simulation time to target date
        const timeDifferenceSeconds =
          (targetDate.getTime() - currentEffectiveDate.getTime()) / 1000;

        console.log(`[SimpleDateCalculator] Processing ${object.id}:`, {
          currentEffectiveDate: currentEffectiveDate.toISOString(),
          targetDate: targetDate.toISOString(),
          timeDifferenceSeconds,
        });

        // Use our existing physics engine to calculate the position at the target date
        const { position, velocity } = calculateKeplerianStateAtTime(
          object.orbit,
          timeDifferenceSeconds,
        );

        console.log(
          `  Calculated position: [${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}]`,
        );

        // Update the orbital elements to reflect the new position
        // Calculate the new mean anomaly based on the time difference
        let updatedMeanAnomaly: number;

        if (object.orbit.eccentricity > 1) {
          // Hyperbolic orbit - use hyperbolic mean motion
          const SUN_MASS = 1.9885e30; // kg
          const G = 6.6743e-11; // m³/kg/s²
          const mu = G * SUN_MASS;
          const absSemiMajorAxis = Math.abs(object.orbit.realSemiMajorAxis_m);
          const meanMotionHyperbolic = Math.sqrt(
            mu / Math.pow(absSemiMajorAxis, 3),
          );
          updatedMeanAnomaly =
            object.orbit.meanAnomaly +
            meanMotionHyperbolic * timeDifferenceSeconds;
        } else {
          // Elliptical/parabolic orbit
          const meanMotion = (2 * Math.PI) / object.orbit.period_s; // radians per second
          updatedMeanAnomaly =
            object.orbit.meanAnomaly + meanMotion * timeDifferenceSeconds;
        }

        const updatedElements = {
          ...object.orbit,
          meanAnomaly:
            object.orbit.eccentricity > 1
              ? updatedMeanAnomaly // Don't normalize hyperbolic mean anomaly
              : updatedMeanAnomaly % (2 * Math.PI), // Keep elliptical orbits in [0, 2π]
        };

        results.push({
          objectId: object.id,
          position,
          velocity,
          updatedOrbitalElements: updatedElements,
        });

        console.log(
          `[SimpleDateCalculator] ✅ Position calculated for ${object.id}`,
        );
      } catch (error) {
        console.warn(
          `[SimpleDateCalculator] Failed to calculate position for ${object.id}:`,
          error,
        );
      }
    });

    console.log(
      `[SimpleDateCalculator] Completed calculations: ${results.length} objects, ${objectsToRemove.length} to remove`,
    );

    return { results, objectsToRemove };
  }

  /**
   * Validates that a date change is reasonable
   */
  public static validateDateChange(
    currentDate: Date,
    targetDate: Date,
    maxYears: number = 1000,
  ): { isValid: boolean; reason?: string } {
    const timeDifferenceMs = Math.abs(
      targetDate.getTime() - currentDate.getTime(),
    );
    const yearMs = 365.25 * 24 * 3600 * 1000;
    const yearsDifference = timeDifferenceMs / yearMs;

    if (yearsDifference > maxYears) {
      return {
        isValid: false,
        reason: `Date change too large: ${Math.round(yearsDifference)} years (max: ${maxYears} years)`,
      };
    }

    // Check if date is too far in the past (before year 1900)
    if (targetDate.getFullYear() < 1900) {
      return {
        isValid: false,
        reason: "Date cannot be before year 1900",
      };
    }

    // Check if date is too far in the future (after year 3000)
    if (targetDate.getFullYear() > 3000) {
      return {
        isValid: false,
        reason: "Date cannot be after year 3000",
      };
    }

    return { isValid: true };
  }
}
