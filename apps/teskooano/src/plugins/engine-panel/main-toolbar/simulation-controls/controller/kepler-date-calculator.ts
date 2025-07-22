import { OSVector3 } from "@teskooano/core-math";
import {
  calculateKeplerianStateAtTime,
  calculateOrbitalPosition,
  getJulianDayForEpoch,
  dateToJulianDay,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  OrbitalParameters,
} from "@teskooano/data-types";

export interface DateCalculationResult {
  objectId: string;
  position: OSVector3;
  velocity: OSVector3;
  date: Date;
}

export interface DateCalculationResponse {
  results: DateCalculationResult[];
  objectsToRemove: string[];
}

export class KeplerDateCalculator {
  /**
   * Calculates the positions of all celestial objects for a specific date
   * using Kepler's laws and orbital parameters.
   *
   * @param targetDate - The date to calculate positions for
   * @param celestialObjects - Map of all celestial objects
   * @param orbitalParameters - Map of orbital parameters for each object
   * @returns Array of calculated positions and velocities
   */
  public static calculatePositionsForDate(
    targetDate: Date,
    celestialObjects: Record<string, CelestialObject>,
    orbitalParameters: Map<string | number, OrbitalParameters>,
  ): DateCalculationResponse {
    const results: DateCalculationResult[] = [];
    const objectsToRemove: string[] = [];

    // Convert the target date to seconds from J2000 epoch
    const targetTimeSeconds = this.dateToSecondsFromEpoch(targetDate);

    console.log(`Target date: ${targetDate.toISOString()}`);
    console.log(`Target time from J2000: ${targetTimeSeconds} seconds`);

    // Find the primary star (usually the sun)
    const primaryStar = Object.values(celestialObjects).find(
      (obj) => obj.type === CelestialType.STAR && !obj.parentId,
    );

    if (!primaryStar) {
      console.warn("No primary star found for date calculations");
      return { results, objectsToRemove };
    }

    // Calculate positions for each object
    Object.values(celestialObjects).forEach((object) => {
      if (object.status !== CelestialStatus.ACTIVE) {
        console.log(`Skipping ${object.id} - status: ${object.status}`);
        return;
      }

      if (object.type === CelestialType.ASTEROID_FIELD) {
        console.log(`Skipping ${object.id} - type: ${object.type}`);
        return;
      }

      // Check if this is an asteroid field or satellite that shouldn't exist before its launch date
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
              `Removing ${object.id} (${object.type}) - target date ${targetDate.toISOString()} is before launch date ${earliestDate}`,
            );
            objectsToRemove.push(object.id);
            return;
          }
        }
      }

      const orbitalParams = orbitalParameters.get(object.id);
      if (!orbitalParams) {
        // Object has no orbital parameters, skip
        console.log(`Skipping ${object.id} - no orbital parameters`);
        return;
      }

      try {
        let position: OSVector3;
        let velocity: OSVector3;

        // Debug orbital parameters for this object
        console.log(`Calculating for ${object.id}:`, {
          semiMajorAxis: orbitalParams.realSemiMajorAxis_m,
          eccentricity: orbitalParams.eccentricity,
          period: orbitalParams.period_s,
          meanAnomaly: orbitalParams.meanAnomaly,
          epoch: orbitalParams.epoch,
          type: object.type,
        });

        if (object.parentId && object.parentId !== primaryStar.id) {
          // Object orbits a body other than the primary star
          // For now, we'll use the primary star as reference
          // In a more complex implementation, we'd trace the hierarchy
          const parentOrbitalParams = orbitalParameters.get(object.parentId);
          if (parentOrbitalParams) {
            // Calculate parent position first, then object relative to parent
            const parentState = this.calculateObjectState(
              targetTimeSeconds,
              parentOrbitalParams,
            );

            const relativePosition = calculateOrbitalPosition(
              {
                id: object.parentId,
                mass_kg: celestialObjects[object.parentId]?.realMass_kg || 0,
                position_m: parentState.position,
                velocity_mps: parentState.velocity,
              },
              orbitalParams,
              targetTimeSeconds,
            );

            position = parentState.position.clone().add(relativePosition);
            velocity = parentState.velocity.clone(); // Simplified
          } else {
            // Fallback to primary star
            position = this.calculateObjectState(
              targetTimeSeconds,
              orbitalParams,
            ).position;
            velocity = this.calculateObjectState(
              targetTimeSeconds,
              orbitalParams,
            ).velocity;
          }
        } else {
          // Object orbits the primary star directly
          position = this.calculateObjectState(
            targetTimeSeconds,
            orbitalParams,
          ).position;
          velocity = this.calculateObjectState(
            targetTimeSeconds,
            orbitalParams,
          ).velocity;
        }

        results.push({
          objectId: object.id,
          position,
          velocity,
          date: targetDate,
        });
      } catch (error) {
        console.warn(`Failed to calculate position for ${object.id}:`, error);
      }
    });

    return { results, objectsToRemove };
  }

  /**
   * Calculates the state (position and velocity) of an object at a specific time
   * using Kepler's laws.
   *
   * @param timeSeconds - Time in seconds from epoch
   * @param orbitalParams - Orbital parameters of the object
   * @returns Object state with position and velocity
   */
  private static calculateObjectState(
    timeSeconds: number,
    orbitalParams: OrbitalParameters,
  ): { position: OSVector3; velocity: OSVector3 } {
    // timeSeconds is the time from J2000 to target date
    // We need to calculate the time from the orbital parameters' epoch to target date
    let adjustedTimeSeconds = timeSeconds;

    if (orbitalParams.epoch && orbitalParams.epoch !== "J2000") {
      // Parse the orbital parameters' epoch
      const epochDate = this.parseEpoch(orbitalParams.epoch);

      // Calculate time from orbital epoch to target date
      const targetDate = this.secondsFromEpochToDate(timeSeconds);
      const timeFromEpochToTarget =
        this.dateToSecondsFromEpoch(targetDate) -
        this.dateToSecondsFromEpoch(epochDate);

      adjustedTimeSeconds = timeFromEpochToTarget;

      console.log(`Epoch adjustment for ${orbitalParams.epoch}:`, {
        epochDate: epochDate.toISOString(),
        targetDate: targetDate.toISOString(),
        timeFromEpochToTarget,
        originalTimeSeconds: timeSeconds,
        adjustedTimeSeconds,
      });
    } else {
      // For J2000 epoch or no epoch, use the time as-is
      console.log(
        `Using time as-is for epoch: ${orbitalParams.epoch || "none"}`,
      );
    }

    const state = calculateKeplerianStateAtTime(
      orbitalParams,
      adjustedTimeSeconds,
    );

    return {
      position: state.position,
      velocity: state.velocity,
    };
  }

  /**
   * Parses an epoch string (e.g., "J2000", "1986-02-09", "JD 2459200.5") into a Date object.
   * Uses the existing Julian Day parser from the physics engine.
   */
  private static parseEpoch(epoch: string): Date {
    // Use the existing Julian Day parser from the physics engine
    const julianDay = getJulianDayForEpoch(epoch);

    // Convert Julian Day to Date object
    // Julian Day 0 is January 1, 4713 BC, so we need to convert to a JavaScript Date
    const jd2000 = 2451545.0; // Julian Day for J2000
    const daysSinceJ2000 = julianDay - jd2000;
    const millisecondsSinceJ2000 = daysSinceJ2000 * 24 * 60 * 60 * 1000;

    const j2000Date = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    const epochDate = new Date(j2000Date.getTime() + millisecondsSinceJ2000);

    console.log(
      `Parsed epoch "${epoch}" to Julian Day ${julianDay}, date: ${epochDate.toISOString()}`,
    );

    return epochDate;
  }

  /**
   * Converts a date to seconds from a reference epoch.
   * Uses J2000 (January 1, 2000, 12:00:00 UTC) as the reference epoch.
   *
   * @param date - The date to convert
   * @returns Seconds from J2000 epoch
   */
  public static dateToSecondsFromEpoch(date: Date): number {
    const j2000Epoch = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    return (date.getTime() - j2000Epoch.getTime()) / 1000;
  }

  /**
   * Converts seconds from J2000 epoch to a Date object.
   *
   * @param secondsFromEpoch - Seconds from J2000 epoch
   * @returns Date object
   */
  public static secondsFromEpochToDate(secondsFromEpoch: number): Date {
    const j2000Epoch = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
    return new Date(j2000Epoch.getTime() + secondsFromEpoch * 1000);
  }
}
