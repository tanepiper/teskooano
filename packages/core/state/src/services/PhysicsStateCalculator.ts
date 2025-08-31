import { OSVector3, createSeededRandomSync } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  PhysicsStateReal,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import { AU_METERS, MIN_ROGUE_DISTANCE_AU } from "@teskooano/data-values";

/**
 * Service responsible for calculating physics state from celestial objects
 * and creating renderable celestial objects.
 */
export class PhysicsStateCalculator {
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
      // and should orbit around the barycenter
      if (data.orbit && data.orbit.period_s > 0) {
        // Calculate total mass of all stars in the system for barycenter
        const totalStarMass = Object.values(allObjects)
          .filter((obj) => obj.type === CelestialType.STAR)
          .reduce((sum, star) => sum + star.realMass_kg, 0);

        const barycentricState: PhysicsStateReal = {
          id: "barycenter",
          mass_kg: totalStarMass,
          position_m: new OSVector3().setZero(),
          velocity_mps: new OSVector3().setZero(),
        };

        try {
          const initialPos = calculateOrbitalPosition(
            barycentricState,
            data.orbit,
            0,
          );
          const initialVel = calculateOrbitalVelocity(
            barycentricState,
            data.orbit,
            0,
          );

          return {
            id: data.id,
            mass_kg: data.realMass_kg,
            position_m: initialPos,
            velocity_mps: initialVel,
          };
        } catch (error) {
          console.error(
            `[PhysicsStateCalculator] Error calculating primary star orbit for ${data.id}:`,
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
      return this.calculateRogueObjectPhysics(data);
    }

    // Handle normal orbital objects
    return this.calculateOrbitalPhysics(data, allObjects, visitedIds);
  }

  /**
   * Creates a renderable celestial object from a base celestial object
   */
  public static async createRenderableObject<
    T extends CelestialSpecificPropertiesUnion,
  >(
    data: CelestialObject<T>,
    allObjects: Record<string, CelestialObject>,
  ): Promise<RenderableCelestialObject<T> | null> {
    const physicsState = this.calculatePhysicsState(
      data,
      allObjects,
      new Set(),
    );
    if (!physicsState) {
      return null;
    }

    const { Vector3, Quaternion } = await import("three");

    // Create renderable object with calculated physics state
    const renderable: RenderableCelestialObject<T> = {
      ...data,
      radius: data.realRadius_m, // Will be scaled by renderer
      mass: data.realMass_kg,
      position: new Vector3(
        physicsState.position_m.x,
        physicsState.position_m.y,
        physicsState.position_m.z,
      ),
      velocity: new Vector3(
        physicsState.velocity_mps.x,
        physicsState.velocity_mps.y,
        physicsState.velocity_mps.z,
      ),
      velocityMagnitude_mps: physicsState.velocity_mps.length(),
      rotation: new Quaternion(),
      physicsStateReal: physicsState,
      isVisible: true,
      isTargetable: true,
      isSelected: false,
      isFocused: false,
      uniforms: {},
    };

    return renderable;
  }

  private static isSpecialObject(type: CelestialType): boolean {
    return [
      CelestialType.RING_SYSTEM,
      CelestialType.OORT_CLOUD,
      CelestialType.ASTEROID_FIELD,
    ].includes(type);
  }

  private static calculateSpecialObjectPhysics(
    data: CelestialObject,
    allObjects: Record<string, CelestialObject>,
  ): PhysicsStateReal | null {
    const parent = data.parentId ? allObjects[data.parentId] : undefined;
    if (!parent) {
      console.error(`[PhysicsStateCalculator] Parent not found for ${data.id}`);
      return null;
    }

    // For special objects, use parent's position (they don't have their own physics)
    return {
      id: data.id,
      mass_kg: 0,
      position_m: new OSVector3().setZero(), // Will be set by parent
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
  ): PhysicsStateReal {
    const random = createSeededRandomSync(
      `rogue-${data.id}-${data.seed ?? "default"}`,
    );
    const baseDistance = data.orbit?.meanAnomaly || random() * 100 + 50;
    const safeDistanceAU = Math.max(baseDistance, MIN_ROGUE_DISTANCE_AU);

    return {
      id: data.id,
      mass_kg: data.realMass_kg,
      position_m: new OSVector3().setFromArray([
        safeDistanceAU * AU_METERS,
        (random() - 0.5) * safeDistanceAU * AU_METERS * 0.1,
        (random() - 0.5) * safeDistanceAU * AU_METERS * 0.1,
      ]),
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
      console.error(`[PhysicsStateCalculator] Parent not found for ${data.id}`);
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

      return {
        id: data.id,
        mass_kg: data.realMass_kg,
        position_m: initialWorldPos,
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
