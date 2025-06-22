import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { AU_METERS, SCALE } from "@teskooano/data-types";

const METERS_TO_SCENE_UNITS = SCALE.RENDER_SCALE_AU / AU_METERS;

/**
 * Converts a physics position vector (OSVector3 in meters, Y-up)
 * to a ThreeJS scene position vector (THREE.Vector3 in scene units, Y-up).
 *
 * @param target - Optional THREE.Vector3 to store the result in.
 * @param physicsPosition - The position vector from the physics engine (meters).
 * @returns The position vector scaled for the ThreeJS scene.
 */
export function physicsToThreeJSPosition(
  target: THREE.Vector3,
  physicsPosition: OSVector3,
): THREE.Vector3 {
  target.x = physicsPosition.x * METERS_TO_SCENE_UNITS;
  target.y = physicsPosition.y * METERS_TO_SCENE_UNITS;
  target.z = physicsPosition.z * METERS_TO_SCENE_UNITS;
  return target;
}

/**
 * Converts a ThreeJS scene position vector (THREE.Vector3 in scene units, Y-up)
 * back to a physics position vector (OSVector3 in meters, Y-up).
 *
 * @param scenePosition - The position vector from the ThreeJS scene (scene units).
 * @param target - Optional OSVector3 to store the result in.
 * @returns The position vector in physics engine units (meters).
 */
export function threeJSToPhysicsPosition(
  scenePosition: THREE.Vector3,
  target?: OSVector3,
): OSVector3 {
  const result = target || new OSVector3();

  const SCENE_UNITS_TO_METERS = 1 / METERS_TO_SCENE_UNITS;

  result.x = scenePosition.x * SCENE_UNITS_TO_METERS;
  result.y = scenePosition.y * SCENE_UNITS_TO_METERS;
  result.z = scenePosition.z * SCENE_UNITS_TO_METERS;

  return result;
}
