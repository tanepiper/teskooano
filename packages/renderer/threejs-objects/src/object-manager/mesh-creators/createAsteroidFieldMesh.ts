import { CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import { CreatorDependencies } from "../../types";
import { createFallbackSphere } from "./createFallbackSphere";

/**
 * @internal
 * Creates an Asteroid Field mesh, typically managed as a THREE.LOD object or a particle system.
 *
 * This function attempts to retrieve a specific `AsteroidFieldRenderer` from the
 * `deps.celestialRenderers` cache, expecting it to be keyed by `CelestialType.ASTEROID_FIELD`.
 * This specialized renderer is responsible for generating the visual representation of the field,
 * which might involve instancing multiple asteroid meshes, using particle systems, or other techniques.
 *
 * The visual output is obtained via the renderer's `getLODLevels` method.
 * If a renderer is found and provides valid LOD levels, an LOD-managed object is returned.
 * If any step fails, this function currently falls back to creating a single default sphere,
 * which is NOT an appropriate representation for an asteroid field.
 * TODO: Implement a more suitable fallback for asteroid fields (e.g., a sparse THREE.Points).
 *
 * @param object - The renderable celestial object representing the asteroid field.
 *                 Its properties should define the characteristics of the field.
 * @param deps - Dependencies including the renderer cache and LOD creation callback.
 * @returns A THREE.Object3D representing the asteroid field or a fallback sphere (placeholder).
 */
export function createAsteroidFieldMesh(
  object: RenderableCelestialObject,
  deps: CreatorDependencies,
): THREE.Object3D {
  // Asteroid fields should have a specific renderer instance cached under this key.
  const renderer = deps.celestialRenderers.get(CelestialType.ASTEROID_FIELD);

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      return deps.createLodCallback(object, lodLevels);
    }
    console.warn(
      `[MeshFactory:AsteroidField] Renderer for ${object.celestialObjectId} (Type: ASTEROID_FIELD) provided no valid LOD levels. Using fallback (sphere).`,
    );
  } else if (renderer) {
    console.warn(
      `[MeshFactory:AsteroidField] Renderer for ${object.celestialObjectId} (Type: ASTEROID_FIELD) lacks getLODLevels method. Using fallback (sphere).`,
    );
  } else {
    console.warn(
      `[MeshFactory:AsteroidField] No renderer found for key 'ASTEROID_FIELD' (object: ${object.celestialObjectId}). Using fallback (sphere).`,
    );
  }

  // TODO: Implement a better fallback for asteroid fields than a single sphere.
  console.warn(
    `[MeshFactory:AsteroidField] Fallback sphere used for asteroid field ${object.celestialObjectId}. This should be improved.`,
  );
  return createFallbackSphere(object);
}
