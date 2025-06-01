import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  BaseTerrestrialRenderer,
  type CelestialRenderer,
  type LODLevel,
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";
import { CreatorDependencies } from "../../types";

/**
 * @internal
 * Creates a Planet mesh, typically a THREE.LOD object.
 *
 * This function attempts to retrieve an existing renderer for the planet from the cache.
 * If not found, it creates a new one by instantiating `BaseTerrestrialRenderer`,
 * which is the common renderer for terrestrial bodies like planets and moons.
 * If a renderer is successfully obtained and provides valid LOD levels, an LOD mesh is constructed.
 * If a suitable renderer cannot be found/created or LOD levels are invalid,
 * it falls back to creating a default sphere mesh.
 *
 * @param object - The renderable celestial object representing the planet.
 * @param deps - Dependencies including renderer cache and LOD creation callback.
 * @returns A THREE.Object3D (usually a THREE.LOD) for the planet or a fallback sphere.
 */
export function createPlanetMesh(
  object: RenderableCelestialObject,
  deps: CreatorDependencies,
): THREE.Object3D {
  let renderer = deps.planetRenderers.get(object.celestialObjectId);

  if (!renderer) {
    try {
      // Planets, like moons, typically use the BaseTerrestrialRenderer.
      const newRenderer = new BaseTerrestrialRenderer();
      renderer = newRenderer;
      deps.planetRenderers.set(object.celestialObjectId, renderer);
    } catch (error) {
      console.error(
        `[MeshFactory:Planet] Error instantiating BaseTerrestrialRenderer for ${object.celestialObjectId}:`,
        error,
      );
      // Fallback will be used due to error
    }
  }

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      return deps.createLodCallback(object, lodLevels);
    }
    console.warn(
      `[MeshFactory:Planet] Renderer for ${object.celestialObjectId} provided no valid LOD levels. Using fallback.`,
    );
  } else if (renderer) {
    console.warn(
      `[MeshFactory:Planet] Renderer for ${object.celestialObjectId} (supposedly BaseTerrestrialRenderer) lacks getLODLevels method. Using fallback.`,
    );
  } else {
    console.warn(
      `[MeshFactory:Planet] No suitable renderer found or created for ${object.celestialObjectId}. Using fallback.`,
    );
  }

  return createFallbackSphere(object);
}
