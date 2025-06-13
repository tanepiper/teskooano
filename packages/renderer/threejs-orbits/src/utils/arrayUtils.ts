import { OSVector3 } from "@teskooano/core-math";
import * as THREE from "three";

/**
 * Efficiently updates a target array of THREE.Vector3 from a source array of OSVector3.
 * It reuses existing vectors in the target array and adds/removes vectors as needed.
 *
 * @param sourcePoints - The source array of OSVector3 points.
 * @param targetPoints - The target array of THREE.Vector3 points to update.
 * @returns The updated target array of THREE.Vector3 points.
 */
export function updateThreeVector3Array(
  sourcePoints: OSVector3[],
  targetPoints: THREE.Vector3[],
): THREE.Vector3[] {
  // Update existing vectors
  for (let i = 0; i < sourcePoints.length; i++) {
    if (i < targetPoints.length) {
      // Reuse existing THREE.Vector3 object
      targetPoints[i].set(
        sourcePoints[i].x,
        sourcePoints[i].y,
        sourcePoints[i].z,
      );
    } else {
      // Add new THREE.Vector3 object
      targetPoints.push(
        new THREE.Vector3(
          sourcePoints[i].x,
          sourcePoints[i].y,
          sourcePoints[i].z,
        ),
      );
    }
  }

  // Remove excess vectors
  if (targetPoints.length > sourcePoints.length) {
    targetPoints.length = sourcePoints.length;
  }

  return targetPoints;
}
