import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import {
  createStarRenderer,
  type CelestialRenderer,
} from "@teskooano/systems-celestial";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";
import { AsteroidFieldRenderer } from "@teskooano/systems-celestial";

interface CreateAsteroidFieldMeshDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates an Asteroid Field mesh (potentially an LOD object or points).
 */
export function createAsteroidFieldMesh(
  object: RenderableCelestialObject,
  deps: CreateAsteroidFieldMeshDeps,
): THREE.Object3D {
  const renderer = deps.celestialRenderers.get(CelestialType.ASTEROID_FIELD);

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = deps.createLodCallback(object, lodLevels);
      return lod;
    } else {
      console.warn(
        `[MeshFactory:AsteroidField] Renderer for ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    // TODO: Asteroid field might have direct creation, e.g., createPoints()
    console.warn(
      `[MeshFactory:AsteroidField] No suitable renderer with getLODLevels found for ${object.celestialObjectId}.`,
    );
  }

  return createFallbackSphere(object);
}
