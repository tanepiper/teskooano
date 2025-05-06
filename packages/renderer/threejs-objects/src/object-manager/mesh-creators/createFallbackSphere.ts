import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";

/**
 * @internal
 * Creates a simple fallback sphere mesh.
 * Used when debug mode is enabled or if specific mesh creation fails.
 * @param object - The celestial object data (used for radius).
 * @returns A simple THREE.Mesh sphere.
 */
export function createFallbackSphere(
  object: RenderableCelestialObject,
): THREE.Mesh {
  const radius = object.radius || 1; // Use radius or default
  // Adjusted scale for visibility during debugging
  const geometry = new THREE.SphereGeometry(radius * 0.0001, 16, 8);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff00ff, // Magenta indicates fallback
    wireframe: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `${object.celestialObjectId}-fallback`;
  console.log(
    `[MeshFactory:Fallback] Created fallback sphere for ${object.celestialObjectId}`,
  );
  return mesh;
}
