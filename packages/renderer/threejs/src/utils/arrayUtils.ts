import type { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";

/**
 * Updates a target array of THREE.Vector3 with positions from an array of OSVector3,
 * minimizing new object creation.
 *
 * @param source - The array of OSVector3 positions.
 * @param target - The array of THREE.Vector3 to update.
 * @returns The updated target array.
 */
export function updateThreeVector3Array(
  source: OSVector3[],
  target: THREE.Vector3[],
): THREE.Vector3[] {
  for (let i = 0; i < source.length; i++) {
    if (target[i]) {
      target[i].set(source[i].x, source[i].y, source[i].z);
    } else {
      target[i] = new THREE.Vector3(source[i].x, source[i].y, source[i].z);
    }
  }
  // If the source is smaller than the target, trim the target
  if (source.length < target.length) {
    target.length = source.length;
  }
  return target;
}
