import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import type { CelestialRenderer } from "../base/CelestialRenderer";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { createFallbackSphere } from "../utils/createFallbackSphere";
import { AsteroidFieldRenderer } from "./AsteroidFieldRenderer";

interface CreateAsteroidFieldMeshDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodObject: (
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
  const renderer = new AsteroidFieldRenderer();
  deps.celestialRenderers.set(object.celestialObjectId, renderer);

  const lodLevels = renderer.getLODLevels(object);
  if (lodLevels && lodLevels.length > 0) {
    const lod = deps.createLodObject(object, lodLevels);
    return lod;
  }

  console.warn(
    `[MeshFactory:AsteroidField] Renderer for ${object.celestialObjectId} provided no valid LOD levels. Using fallback.`,
  );
  return createFallbackSphere(object);
}
