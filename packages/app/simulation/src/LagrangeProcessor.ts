import { OSVector3 } from "@teskooano/core-math";
import {
  PhysicsStateReal,
  calculateAllLagrangePoints,
  createTwoBodySystem,
} from "@teskooano/core-physics";
import { CelestialObject } from "@teskooano/data-types";

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
    if (!obj.orbit.lagrangePointType) {
      return;
    }

    if (obj.parentId && obj.lagrangePointTargetId) {
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

      const realTwoBodySystem = createTwoBodySystem(
        primaryPhysicsState,
        secondaryPhysicsState,
      );
      const realLagrangePoints = calculateAllLagrangePoints(realTwoBodySystem);
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
    }
  });
}
