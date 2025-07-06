import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import type { CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import * as THREE from "three";
import { createFallbackSphere } from "../utils/createFallbackSphere";
import { OortCloudRenderer } from "./OortCloudRenderer";

interface CreateOortCloudMeshDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodObject: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates an Oort Cloud mesh (potentially an LOD object).
 */
export function createOortCloudMesh(
  object: RenderableCelestialObject,
  deps: CreateOortCloudMeshDeps,
): THREE.Object3D {
  // Create and register the OortCloudRenderer instance
  const renderer = new OortCloudRenderer();
  deps.celestialRenderers.set(object.celestialObjectId, renderer);

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = deps.createLodObject(object, lodLevels);
      return lod;
    } else {
      console.warn(
        `[MeshFactory:OortCloud] Renderer for OORT_CLOUD ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[MeshFactory:OortCloud] No suitable renderer with getLODLevels found for OORT_CLOUD ${object.celestialObjectId}.`,
    );
  }

  return createFallbackSphere(object);
}
