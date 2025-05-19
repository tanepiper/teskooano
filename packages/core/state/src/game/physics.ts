import type { CelestialObject, PhysicsStateReal } from "@teskooano/data-types";
import { AU_METERS, SCALE } from "@teskooano/data-types";
import * as THREE from "three";
import { renderableActions } from "./renderableStore";
import { simulationStateService } from "./simulation";
import { gameStateService } from "./stores";

let updateCounter = 0;
const ORBITAL_ELEMENT_UPDATE_INTERVAL = 60;

/**
 * Get REAL physics bodies array for simulation
 */
export const getPhysicsBodies = (): PhysicsStateReal[] => {
  const bodies: PhysicsStateReal[] = [];
  Object.values(gameStateService.getCelestialObjects()).forEach((obj) => {
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
    const existingObject = gameStateService.getCelestialObjects()[id];
    if (!existingObject) {
      console.warn(
        `[updatePhysicsState] Cannot find existing object with ID: ${id} (for state update)`,
      );
      return;
    }

    let rotationQuaternion = new THREE.Quaternion();
    if (
      existingObject.siderealRotationPeriod_s &&
      existingObject.siderealRotationPeriod_s !== 0 &&
      existingObject.axialTilt
    ) {
      const currentTime = simulationStateService.getCurrentState().time;
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

    const updatedPositionScaled = bodyReal.position_m
      .clone()
      .multiplyScalar(METERS_TO_SCENE_UNITS)
      .toThreeJS();

    const newObjectData: CelestialObject = {
      ...existingObject,
      physicsStateReal: bodyReal,
    };
    gameStateService.setCelestialObject(id, newObjectData);
  });
};
