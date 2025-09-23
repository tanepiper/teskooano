import { OSVector3, createSeededRandomSync } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  PhysicsStateReal,
} from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import { AU_METERS, MIN_ROGUE_DISTANCE_AU } from "@teskooano/data-values";

/**
 * Service responsible for calculating physics state from celestial objects
 * and creating renderable celestial objects.
 */
export class PhysicsStateCalculator {
  /**
   * Track which objects we've already warned about missing parents to avoid console spam
   */
  private static missingParentWarnings = new Set<string>();

  /**
   * Cache for barycenter offset calculations to avoid recalculating for each object
   */
  private static barycenterOffsetCache = new Map<string, OSVector3>();
  /**
   * Clears the barycenter offset cache. Call this when the system configuration changes.
   */
  public static clearBarycenterCache(): void {
    this.barycenterOffsetCache.clear();
  }

  /**
   * Calculates physics state for a celestial object based on its orbital parameters
   */
  public static calculatePhysicsState<
    T extends CelestialSpecificPropertiesUnion,
  >(
    data: CelestialObject<T>,
    allObjects: Record<string, CelestialObject>,
    visitedIds: Set<string> = new Set(),
  ): PhysicsStateReal | null {
    // Handle special object types
    if (this.isSpecialObject(data.type)) {
      return this.calculateSpecialObjectPhysics(data, allObjects);
    }

    // Handle root stars - use orbital parameters to determine if it's a multi-star system
    if (data.type === CelestialType.STAR && !data.parentId) {
      // If the star has valid orbital parameters (non-zero period), it's part of a multi-star system
      if (data.orbit && data.orbit.period_s > 0) {
        return this.calculateMultiStarSystemPhysics(data, allObjects);
      } else {
        // Single star system: no orbital parameters, so zero velocity
        return {
          id: data.id,
          mass_kg: data.realMass_kg,
          position_m: new OSVector3().setZero(),
          velocity_mps: new OSVector3().setZero(),
        };
      }
    }

    // Handle rogue planets/satellites
    if (this.isRogueObject(data)) {
      return this.calculateRogueObjectPhysics(data, allObjects);
    }

    // Handle normal orbital objects
    return this.calculateOrbitalPhysics(data, allObjects, visitedIds);
  }

  private static isSpecialObject(type: CelestialType): boolean {
    return [
      CelestialType.RING_SYSTEM,
      CelestialType.OORT_CLOUD,
      CelestialType.ASTEROID_FIELD,
    ].includes(type);
  }

  /**
   * Calculates physics state for multi-star systems with proper barycenter centering.
   * This method ensures the barycenter of all stars is positioned at the origin (0,0,0).
   */
  private static calculateMultiStarSystemPhysics(
    data: CelestialObject,
    allObjects: Record<string, CelestialObject>,
  ): PhysicsStateReal | null {
    const allStars = Object.values(allObjects).filter(
      (obj) => obj.type === CelestialType.STAR,
    );

    if (allStars.length === 0) {
      console.error(
        "[PhysicsStateCalculator] No stars found for multi-star system calculation",
      );
      return null;
    }

    // Calculate total mass for barycenter
    const totalStarMass = allStars.reduce(
      (sum, star) => sum + star.realMass_kg,
      0,
    );

    // Create a virtual barycenter at the origin for orbital calculations
    const barycentricState: PhysicsStateReal = {
      id: "barycenter",
      mass_kg: totalStarMass,
      position_m: new OSVector3().setZero(),
      velocity_mps: new OSVector3().setZero(),
    };

    try {
      // Calculate this star's position relative to barycenter
      const initialPos = calculateOrbitalPosition(
        barycentricState,
        data.orbit!,
        0,
      );
      const initialVel = calculateOrbitalVelocity(
        barycentricState,
        data.orbit!,
        0,
      );

      // Calculate the actual barycenter position by computing mass-weighted average
      // of all star positions
      const barycenterOffset = this.getBarycenterOffset(allObjects);

      // Offset this star's position so the barycenter ends up at origin
      const centeredPosition = initialPos.clone().sub(barycenterOffset);

      return {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: centeredPosition,
        velocity_mps: initialVel,
      };
    } catch (error) {
      console.error(
        `[PhysicsStateCalculator] Error calculating multi-star system physics for ${data.id}:`,
        error,
      );
      // Fallback to zero if calculation fails
      return {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: new OSVector3().setZero(),
        velocity_mps: new OSVector3().setZero(),
      };
    }
  }

  /**
   * Gets the barycenter offset for the current system, using caching for performance.
   * This computes the mass-weighted average position of all stars.
   */
  private static getBarycenterOffset(
    allObjects: Record<string, CelestialObject>,
  ): OSVector3 {
    // Create a cache key based on the system's star configuration
    const allStars = Object.values(allObjects).filter(
      (obj) => obj.type === CelestialType.STAR,
    );
    const cacheKey = allStars
      .map(
        (star) => `${star.id}:${star.orbit?.period_s || 0}:${star.realMass_kg}`,
      )
      .sort()
      .join("|");

    // Check cache first
    if (this.barycenterOffsetCache.has(cacheKey)) {
      return this.barycenterOffsetCache.get(cacheKey)!.clone();
    }

    // Calculate barycenter offset
    const offset = this.calculateBarycenterOffset(allStars, allObjects);

    // Cache the result
    this.barycenterOffsetCache.set(cacheKey, offset.clone());

    return offset;
  }

  /**
   * Calculates the barycenter offset needed to center the star system at origin.
   * This computes the mass-weighted average position of all stars.
   */
  private static calculateBarycenterOffset(
    allStars: CelestialObject[],
    allObjects: Record<string, CelestialObject>,
  ): OSVector3 {
    if (allStars.length === 0) {
      return new OSVector3().setZero();
    }

    const totalMass = allStars.reduce((sum, star) => sum + star.realMass_kg, 0);
    const weightedPosition = new OSVector3().setZero();

    // Calculate mass-weighted average position of all stars
    allStars.forEach((star) => {
      if (star.orbit && star.orbit.period_s > 0) {
        // For stars with orbital parameters, calculate their position
        const barycentricState: PhysicsStateReal = {
          id: "barycenter",
          mass_kg: totalMass,
          position_m: new OSVector3().setZero(),
          velocity_mps: new OSVector3().setZero(),
        };

        try {
          const starPosition = calculateOrbitalPosition(
            barycentricState,
            star.orbit,
            0,
          );
          weightedPosition.addScaledVector(starPosition, star.realMass_kg);
        } catch (error) {
          console.warn(
            `[PhysicsStateCalculator] Could not calculate position for star ${star.id}, using zero`,
          );
        }
      }
      // For stars without orbital parameters (single star systems), they're already at origin
    });

    // Return the barycenter offset (mass-weighted average position)
    return weightedPosition.clone().multiplyScalar(1 / totalMass);
  }

  private static calculateSpecialObjectPhysics(
    data: CelestialObject,
    allObjects: Record<string, CelestialObject>,
  ): PhysicsStateReal | null {
    const parent = data.parentId ? allObjects[data.parentId] : undefined;
    if (!parent) {
      // Only log error once per object to avoid console spam
      if (!this.missingParentWarnings.has(data.id)) {
        console.error(
          `[PhysicsStateCalculator] Parent not found for ${data.id} (type: ${data.type})`,
        );
        this.missingParentWarnings.add(data.id);
      }
      return null;
    }

    // Get parent's physics state to inherit its position
    const parentPhysics = this.calculatePhysicsState(parent, allObjects);
    if (!parentPhysics) {
      console.error(
        `[PhysicsStateCalculator] Could not calculate parent physics for ${data.id}`,
      );
      return null;
    }

    // For special objects, use parent's position (they don't have their own physics)
    return {
      id: data.id,
      mass_kg: 0,
      position_m: parentPhysics.position_m.clone(), // Use parent's actual position
      velocity_mps: new OSVector3().setZero(),
    };
  }

  private static isRogueObject(data: CelestialObject): boolean {
    return (
      (data.type === CelestialType.PLANET ||
        data.type === CelestialType.GAS_GIANT ||
        data.type === CelestialType.SATELLITE) &&
      !data.parentId &&
      data.orbit &&
      data.orbit.realSemiMajorAxis_m === 0 &&
      data.orbit.eccentricity === 0 &&
      data.orbit.period_s === 0
    );
  }

  private static calculateRogueObjectPhysics(
    data: CelestialObject,
    allObjects: Record<string, CelestialObject>,
  ): PhysicsStateReal {
    const random = createSeededRandomSync(
      `rogue-${data.id}-${data.seed ?? "default"}`,
    );
    const baseDistance = data.orbit?.meanAnomaly || random() * 100 + 50;
    const safeDistanceAU = Math.max(baseDistance, MIN_ROGUE_DISTANCE_AU);

    const position = new OSVector3().setFromArray([
      safeDistanceAU * AU_METERS,
      (random() - 0.5) * safeDistanceAU * AU_METERS * 0.1,
      (random() - 0.5) * safeDistanceAU * AU_METERS * 0.1,
    ]);

    // Apply barycenter offset to rogue objects as well
    const barycenterOffset = this.getBarycenterOffset(allObjects);
    const centeredPosition = position.sub(barycenterOffset);

    return {
      id: data.id,
      mass_kg: data.realMass_kg,
      position_m: centeredPosition,
      velocity_mps: new OSVector3().setFromArray([
        (random() - 0.5) * 500,
        (random() - 0.5) * 500,
        (random() - 0.5) * 500,
      ]),
    };
  }

  private static calculateOrbitalPhysics(
    data: CelestialObject,
    allObjects: Record<string, CelestialObject>,
    visitedIds: Set<string>,
  ): PhysicsStateReal | null {
    if (!data.orbit) {
      console.error(`[PhysicsStateCalculator] Missing orbit for ${data.id}`);
      return null;
    }

    const parent = data.parentId ? allObjects[data.parentId] : undefined;
    if (!parent) {
      // For planets without parents, make them rogue objects instead of failing
      if (data.type === CelestialType.PLANET) {
        // Only warn once per planet to avoid console spam
        if (!this.missingParentWarnings.has(data.id)) {
          console.warn(
            `[PhysicsStateCalculator] Parent not found for planet ${data.id}, making it a rogue object`,
          );
          this.missingParentWarnings.add(data.id);
        }
        return this.calculateRogueObjectPhysics(data, allObjects);
      }

      // For other object types, log error but don't spam the console
      if (!this.missingParentWarnings.has(data.id)) {
        console.error(
          `[PhysicsStateCalculator] Parent not found for ${data.id} (type: ${data.type})`,
        );
        this.missingParentWarnings.add(data.id);
      }
      return null;
    }

    // Check for circular references
    if (visitedIds.has(data.id)) {
      console.error(
        `[PhysicsStateCalculator] Circular reference detected for ${data.id}`,
      );
      return null;
    }

    // Add current object to visited set
    visitedIds.add(data.id);

    // Calculate parent's physics state first (recursively)
    const parentPhysicsState = this.calculatePhysicsState(
      parent,
      allObjects,
      visitedIds,
    );
    if (!parentPhysicsState) {
      console.error(
        `[PhysicsStateCalculator] Could not calculate parent physics state for ${data.id}`,
      );
      return null;
    }

    try {
      const initialRelativePos = calculateOrbitalPosition(
        parentPhysicsState,
        data.orbit,
        0,
      );
      const initialWorldVel = calculateOrbitalVelocity(
        parentPhysicsState,
        data.orbit,
        0,
      );
      const initialWorldPos = initialRelativePos
        .clone()
        .add(parentPhysicsState.position_m);

      // Apply barycenter offset to non-star objects to maintain system centering
      const barycenterOffset = this.getBarycenterOffset(allObjects);
      const centeredPosition = initialWorldPos.clone().sub(barycenterOffset);

      return {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: centeredPosition,
        velocity_mps: initialWorldVel,
      };
    } catch (error) {
      console.error(
        `[PhysicsStateCalculator] Error calculating orbital physics for ${data.id}:`,
        error,
      );
      return null;
    }
  }
}
