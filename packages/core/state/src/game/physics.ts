import type { CelestialObject, PhysicsStateReal } from "@teskooano/data-types";
import { AU_METERS, SCALE } from "@teskooano/data-types";
import * as THREE from "three";
import { renderableActions } from "./renderableStore"; // Import renderable actions
import { simulationState } from "./simulation"; // Import simulationState to get time
import { celestialObjectsStore } from "./stores";

// Counter and Interval for periodic updates
let updateCounter = 0;
const ORBITAL_ELEMENT_UPDATE_INTERVAL = 60; // Recalculate every N updates

/**
 * Get REAL physics bodies array for simulation
 */
export const getPhysicsBodies = (): PhysicsStateReal[] => {
  const bodies: PhysicsStateReal[] = [];
  Object.values(celestialObjectsStore.get()).forEach((obj) => {
    if (obj.physicsStateReal) {
      bodies.push(obj.physicsStateReal);
    } else {
      console.warn(
        `Object ${obj.id} missing physicsStateReal, skipping in simulation.`,
      );
    }
  });
  return bodies;
};

/**
 * Update the physics state of all celestial objects from the simulation result
 * Accepts REAL physics state and updates BOTH the REAL and SCALED states in the store.
 */
export const updatePhysicsState = (
  updatedBodiesReal: PhysicsStateReal[],
): void => {
  const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;

  updatedBodiesReal.forEach((bodyReal) => {
    const id = String(bodyReal.id);
    const existingObject = celestialObjectsStore.get()[id];
    if (!existingObject) {
      console.warn(
        `[updatePhysicsState] Cannot find existing object with ID: ${id} (for state update)`,
      );
      return;
    }

    // --- Calculate Rotation Quaternion ---
    let rotationQuaternion = new THREE.Quaternion(); // Initialize to identity
    if (
      existingObject.siderealRotationPeriod_s &&
      existingObject.siderealRotationPeriod_s !== 0 &&
      existingObject.axialTilt
    ) {
      const currentTime = simulationState.get().time;
      const rotationSpeed =
        (2 * Math.PI) / existingObject.siderealRotationPeriod_s;
      const currentRotationAngle =
        (currentTime * rotationSpeed) % (2 * Math.PI);

      const tiltAxisTHREE = new THREE.Vector3(
        existingObject.axialTilt.x,
        existingObject.axialTilt.y,
        existingObject.axialTilt.z,
      );
      rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(
        tiltAxisTHREE,
        currentRotationAngle,
      );
    }
    // --- End Rotation Calculation ---

    // --- Calculate Scaled Position ---
    const updatedPositionScaled = bodyReal.position_m
      .clone()
      .multiplyScalar(METERS_TO_SCENE_UNITS)
      .toThreeJS();

    // --- Update CORE CelestialObject (only physics state) ---
    const newObjectData: CelestialObject = {
      ...existingObject,
      physicsStateReal: bodyReal, // Update only the real physics state
      // orbit: existingObject.orbit, // Keep existing orbit (already spread)
    };
    celestialObjectsStore.setKey(id, newObjectData);

    // --- REMOVED ---
    // Direct update to renderable store should NOT happen here.
    // RendererStateAdapter handles this by listening to celestialObjectsStore.
    /*
    const scaledPos = physicsToThreeJSPosition(bodyReal.position_m); // Need scaling util
    const scaledRot = new THREE.Quaternion(); // Placeholder rotation
    renderableActions.updateRenderableObject(id, {
        position: scaledPos,
        rotation: scaledRot,
    });
    */
    // --- END REMOVED ---
  });
};
