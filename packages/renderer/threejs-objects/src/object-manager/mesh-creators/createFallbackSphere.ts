import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";

const FALLBACK_RADIUS_DEFAULT = 1; // Default radius if object.radius is invalid
const FALLBACK_COLOR = 0x808080; // Grey
const FALLBACK_SEGMENTS = 16; // Number of segments for the sphere geometry

/**
 * @internal
 * Creates a simple fallback sphere mesh for a celestial object.
 *
 * This function is used when a more specific or detailed mesh cannot be generated
 * for a given celestial object (e.g., due to missing data, errors in renderer creation,
 * or if the object type doesn't have a dedicated mesh creation pathway).
 * It provides a basic visual representation to ensure that something is always rendered.
 *
 * @param object - The renderable celestial object for which to create the fallback sphere.
 *                 The object's `radius` property will be used if available and valid;
 *                 otherwise, a default radius is used.
 * @returns A THREE.Mesh representing the fallback sphere.
 */
export function createFallbackSphere(
  object: RenderableCelestialObject,
): THREE.Mesh {
  const radius = object.radius > 0 ? object.radius : FALLBACK_RADIUS_DEFAULT;
  const geometry = new THREE.SphereGeometry(
    radius,
    FALLBACK_SEGMENTS,
    FALLBACK_SEGMENTS,
  );
  const material = new THREE.MeshBasicMaterial({
    color: FALLBACK_COLOR,
    wireframe: true,
  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.name = `${object.celestialObjectId}-fallbackSphere`;
  return sphere;
}
