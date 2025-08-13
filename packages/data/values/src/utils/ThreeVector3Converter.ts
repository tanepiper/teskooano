import type { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";

/**
 * @class ThreeVector3Converter
 * @description A utility class for efficiently converting arrays of `OSVector3` objects
 * to `THREE.Vector3` arrays, minimizing object allocations by reusing existing `THREE.Vector3`
 * instances and an internal temporary vector.
 * This class acts as a bridge between the renderer-agnostic physics/state layer and Three.js rendering.
 */
export class ThreeVector3Converter {
  private _tempVector: THREE.Vector3 = new THREE.Vector3();

  /**
   * Updates a target array of `THREE.Vector3` objects with positions from an array of `OSVector3`.
   * This method reuses `THREE.Vector3` instances in the target array if they exist, or creates new ones
   * if needed. It also reuses an internal temporary vector to optimize the conversion process.
   *
   * @param source - The array of `OSVector3` positions from the physics or state layer.
   * @param target - The array of `THREE.Vector3` to update with the new positions.
   * @returns The updated target array of `THREE.Vector3` objects.
   */
  public update(source: OSVector3[], target: THREE.Vector3[]): THREE.Vector3[] {
    for (let i = 0; i < source.length; i++) {
      // Use the toThreeJS method that now accepts a target vector to reuse _tempVector
      source[i].toThreeJS(this._tempVector);
      if (target[i]) {
        // If target vector exists, copy the components from _tempVector
        target[i].copy(this._tempVector);
      } else {
        // Otherwise, create a new THREE.Vector3 from _tempVector
        target[i] = this._tempVector.clone();
      }
    }
    // If the source is smaller than the target, trim the target
    if (source.length < target.length) {
      target.length = source.length;
    }
    return target;
  }
}
