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
 * Creates a Moon mesh, typically a THREE.LOD object.
 *
 * This function attempts to retrieve an existing renderer for the moon from the cache.
 * If not found, it creates a new one by instantiating `BaseTerrestrialRenderer`,
 * which is the common renderer for terrestrial bodies like moons and planets.
 * If a renderer is successfully obtained and provides valid LOD levels, an LOD mesh is constructed.
 * If a suitable renderer cannot be found/created or LOD levels are invalid,
 * it falls back to creating a default sphere mesh.
 *
 * @param object - The renderable celestial object representing the moon.
 * @param deps - Dependencies including renderer cache and LOD creation callback.
 * @returns A THREE.Object3D (usually a THREE.LOD) for the moon or a fallback sphere.
 */
export function createMoonMesh(
  object: RenderableCelestialObject,
  deps: CreatorDependencies,
): THREE.Object3D {
  let renderer = deps.moonRenderers.get(object.celestialObjectId);

  if (!renderer) {
    try {
      // Moons typically use the BaseTerrestrialRenderer.
      const newRenderer = new BaseTerrestrialRenderer();
      // No specific parameters are passed to the constructor of BaseTerrestrialRenderer in its definition.
      renderer = newRenderer;
      deps.moonRenderers.set(object.celestialObjectId, renderer);
    } catch (error) {
      console.error(
        `[MeshFactory:Moon] Error instantiating BaseTerrestrialRenderer for ${object.celestialObjectId}:`, // Added colon
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
      `[MeshFactory:Moon] Renderer for ${object.celestialObjectId} provided no valid LOD levels. Using fallback.`, // Added fallback info
    );
  } else if (renderer) {
    // This case implies a renderer was created but lacks the getLODLevels method.
    // BaseTerrestrialRenderer should have this method.
    console.warn(
      `[MeshFactory:Moon] Renderer for ${object.celestialObjectId} (supposedly BaseTerrestrialRenderer) lacks getLODLevels method. Using fallback.`, // Added fallback info
    );
  } else {
    // This implies renderer is still undefined after attempting creation, so instantiation must have failed.
    console.warn(
      `[MeshFactory:Moon] No suitable renderer found or created for ${object.celestialObjectId}. Using fallback.`, // Added fallback info
    );
  }

  return createFallbackSphere(object);
}
