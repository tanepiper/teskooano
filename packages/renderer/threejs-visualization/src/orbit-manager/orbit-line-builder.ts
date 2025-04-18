import * as THREE from "three";

/**
 * Creates a new `THREE.BufferGeometry` suitable for rendering an orbit line.
 *
 * Takes an array of points (presumably calculated orbit points) and sets them
 * as the positions for the geometry's vertices.
 *
 * @param orbitPoints Array of points representing the orbit.
 * @returns BufferGeometry for the orbit line.
 */
export function createOrbitLineGeometry(
  orbitPoints: THREE.Vector3[]
): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setFromPoints(orbitPoints);
}

/**
 * Updates the geometry of an existing `THREE.Line` object with a new set of points.
 *
 * This is useful for dynamically updating orbit visualizations without recreating the entire Line object.
 * It replaces the existing `position` attribute data in the line's geometry.
 *
 * @param line The `THREE.Line` object to update.
 * @param orbitPoints New array of `THREE.Vector3` points defining the updated orbit shape.
 * @returns The updated `THREE.Line` object (the same instance passed in).
 */
export function updateOrbitLine(
  line: THREE.Line,
  orbitPoints: THREE.Vector3[]
): THREE.Line {
  if (line.geometry instanceof THREE.BufferGeometry) {
    const positions = new Float32Array(orbitPoints.length * 3);

    for (let i = 0; i < orbitPoints.length; i++) {
      positions[i * 3] = orbitPoints[i].x;
      positions[i * 3 + 1] = orbitPoints[i].y;
      positions[i * 3 + 2] = orbitPoints[i].z;
    }

    line.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    line.geometry.attributes.position.needsUpdate = true;
  }

  return line;
}

/**
 * Safely disposes of the geometry and material associated with a `THREE.Line` object.
 *
 * This helps prevent memory leaks by freeing up GPU resources when an orbit line
 * is no longer needed.
 *
 * @param line The orbit line to dispose
 */
export function disposeOrbitLine(line: THREE.Line): void {
  if (line.geometry) {
    line.geometry.dispose();
  }

  if (line.material) {
    if (Array.isArray(line.material)) {
      line.material.forEach((mat) => mat.dispose());
    } else {
      line.material.dispose();
    }
  }
}
