import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";

/**
 * Creates a simple, unlit sphere mesh to be used as a fallback when a
 * more detailed mesh cannot be created due to errors or missing data.
 *
 * @param object - The data for the celestial object.
 * @returns A `THREE.Mesh` instance representing the fallback sphere.
 */
export function createFallbackSphere(
  object: RenderableCelestialObject,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(object.radius, 16, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff00ff, // Bright magenta to make it obvious
    wireframe: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `fallback-sphere-${object.celestialObjectId}`;
  return mesh;
}
