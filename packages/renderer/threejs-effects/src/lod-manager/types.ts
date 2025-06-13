import type * as THREE from "three";

/**
 * Defines a single level for a Level of Detail (LOD) object.
 *
 * @property object The 3D object to display for this level.
 * @property distance The distance at which this level becomes visible.
 */
export interface LODLevel {
  object: THREE.Object3D;
  distance: number;
}
