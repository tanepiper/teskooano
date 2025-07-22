import { CelestialObject, LagrangePointType } from "@teskooano/data-types";
import {
  PhysicsStateReal,
  createTwoBodySystem,
  calculateAllLagrangePoints,
  createOrbitalElementsFromLagrangePoint,
} from "@teskooano/core-physics";
import { OSVector3 } from "@teskooano/core-math";

/**
 * Processes celestial objects that are designated to be at Lagrange points.
 * This function updates their initial PhysicsStateReal based on the calculated Lagrange point.
 *
 * It is designed to be called during the simulation initialization phase, after all
 * initial CelestialObjects and their basic PhysicsStateReal (mass, initial position)
 * are available, but before the main simulation loop begins.
 *
 * @param celestialObjects A map of all CelestialObject definitions.
 * @param physicsStates A map of all initial PhysicsStateReal objects. This map will be mutated.
 */
export function processLagrangeObjects(
  celestialObjects: Map<string, CelestialObject>,
  physicsStates: Map<string, PhysicsStateReal>,
): void {
  celestialObjects.forEach((obj) => {
    if (
      obj.orbit.lagrangePointType &&
      obj.parentId &&
      obj.lagrangePointTargetId
    ) {
      const primaryObject = celestialObjects.get(obj.parentId);
      const secondaryObject = celestialObjects.get(obj.lagrangePointTargetId);

      if (!primaryObject) {
        console.warn(
          `[LagrangeProcessor] Primary object '${obj.parentId}' not found for Lagrange-bound object '${obj.id}'. Skipping.`,
        );
        return;
      }
      if (!secondaryObject) {
        console.warn(
          `[LagrangeProcessor] Secondary object '${obj.lagrangePointTargetId}' not found for Lagrange-bound object '${obj.id}'. Skipping.`,
        );
        return;
      }

      // Retrieve current physics states for primary and secondary
      const primaryPhysicsState = physicsStates.get(primaryObject.id);
      const secondaryPhysicsState = physicsStates.get(secondaryObject.id);

      if (!primaryPhysicsState || !secondaryPhysicsState) {
        console.warn(
          `[LagrangeProcessor] Physics states not fully available for Lagrange calculation for '${obj.id}'. Skipping.`,
        );
        return;
      }

      try {
        // Calculate Lagrange point orbital parameters using static properties
        const lagrangeOrbitalParams = createOrbitalElementsFromLagrangePoint(
          obj.orbit.lagrangePointType,
          primaryObject.realMass_kg,
          secondaryObject.realMass_kg,
          // Calculate current separation based on their initial positions
          primaryPhysicsState.position_m.distanceTo(
            secondaryPhysicsState.position_m,
          ),
        );

        // The calculated Lagrange point's realSemiMajorAxis_m is its distance from the primary.
        // Its period_s and averageOrbitalSpeed_mps are also calculated in that function.
        // The most important parts here are the position_m and velocity_mps from the LagrangePoint object.

        // To get the actual Lagrange point position in the global inertial frame:
        // 1. Get the current primary and secondary positions in the inertial frame.
        // 2. Re-create the two-body system with these real-time positions.
        // 3. Calculate all Lagrange points using the real-time positions.
        // 4. Extract the target Lagrange point's actual position and velocity vector.

        const realTwoBodySystem = createTwoBodySystem(
          primaryPhysicsState,
          secondaryPhysicsState,
        );
        const realLagrangePoints =
          calculateAllLagrangePoints(realTwoBodySystem);
        const realLPoint = realLagrangePoints.find(
          (lp) => lp.id === obj.orbit.lagrangePointType,
        );

        if (realLPoint) {
          // Update the object's initial physics state with the Lagrange point data
          const targetPhysicsState = physicsStates.get(obj.id);
          if (targetPhysicsState) {
            targetPhysicsState.position_m = realLPoint.position_m.clone();
            targetPhysicsState.velocity_mps =
              realLPoint.velocity_mps?.clone() ?? new OSVector3(0, 0, 0);
          } else {
            console.warn(
              `[LagrangeProcessor] PhysicsStateReal for '${obj.id}' not found. Cannot apply Lagrange point.`,
            );
          }
        } else {
          console.warn(
            `[LagrangeProcessor] Lagrange point '${obj.orbit.lagrangePointType}' not calculated for '${obj.id}'.`,
          );
        }
      } catch (error) {
        console.error(
          `[LagrangeProcessor] Error calculating Lagrange point for '${obj.id}':`,
          error,
        );
      }
    }
  });
}
