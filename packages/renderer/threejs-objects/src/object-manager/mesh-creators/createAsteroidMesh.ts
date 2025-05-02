import { CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialRenderer, LODLevel } from "@teskooano/systems-celestial";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";

interface CreateAsteroidMeshDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates an Asteroid/Space Rock mesh (potentially an LOD object).
 */
export function createAsteroidMesh(
  object: RenderableCelestialObject,
  deps: CreateAsteroidMeshDeps,
): THREE.Object3D {
  // Use SPACE_ROCK type for lookup
  const renderer = deps.celestialRenderers.get(CelestialType.SPACE_ROCK);

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = deps.createLodCallback(object, lodLevels);
      return lod;
    } else {
      console.warn(
        `[MeshFactory:Asteroid] Renderer for SPACE_ROCK ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    // TODO: Consider if asteroid renderer might have a direct mesh creation method
    // if (!renderer?.createMesh) { ... }
    console.warn(
      `[MeshFactory:Asteroid] No suitable renderer with getLODLevels found for SPACE_ROCK ${object.celestialObjectId}.`,
    );
  }

  return createFallbackSphere(object);
}
