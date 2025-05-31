import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { BaseTerrestrialRenderer } from "@teskooano/systems-celestial";
import * as THREE from "three";
import { CreatorDependencies } from "../../types";
import { createFallbackSphere } from "./createFallbackSphere";

/**
 * @internal
 * Creates an Asteroid mesh, typically a THREE.LOD object.
 *
 * This function attempts to retrieve an existing renderer for the asteroid from the cache.
 * If not found, it currently assumes asteroids can be rendered using `BaseTerrestrialRenderer`,
 * similar to small moons or rocky bodies. A more specific `AsteroidRenderer` could be used if available.
 * If a renderer is successfully obtained and provides valid LOD levels, an LOD mesh is constructed.
 * If a suitable renderer cannot be found/created or LOD levels are invalid,
 * it falls back to creating a default sphere mesh.
 *
 * @param object - The renderable celestial object representing the asteroid.
 * @param deps - Dependencies including renderer cache and LOD creation callback.
 * @returns A THREE.Object3D (usually a THREE.LOD) for the asteroid or a fallback sphere.
 */
export function createAsteroidMesh(
  object: RenderableCelestialObject,
  deps: CreatorDependencies,
): THREE.Object3D {
  let renderer = deps.asteroidRenderers.get(object.celestialObjectId);

  if (!renderer) {
    try {
      // Assuming asteroids can use a BaseTerrestrialRenderer for now.
      // If a specific AsteroidRenderer exists, it should be used here.
      const newRenderer = new BaseTerrestrialRenderer();
      renderer = newRenderer;
      deps.asteroidRenderers.set(object.celestialObjectId, renderer);
    } catch (error) {
      console.error(
        `[MeshFactory:Asteroid] Error instantiating BaseTerrestrialRenderer for ${object.celestialObjectId}:`,
        error,
      );
    }
  }

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      return deps.createLodCallback(object, lodLevels);
    }
    console.warn(
      `[MeshFactory:Asteroid] Renderer for ${object.celestialObjectId} provided no valid LOD levels. Using fallback.`,
    );
  } else if (renderer) {
    console.warn(
      `[MeshFactory:Asteroid] Renderer for ${object.celestialObjectId} lacks getLODLevels method. Using fallback.`,
    );
  } else {
    console.warn(
      `[MeshFactory:Asteroid] No suitable renderer found or created for ${object.celestialObjectId}. Using fallback.`,
    );
  }

  return createFallbackSphere(object);
}
