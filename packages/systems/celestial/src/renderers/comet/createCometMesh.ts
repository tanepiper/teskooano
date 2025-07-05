import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import type { CelestialRenderer } from "../base/CelestialRenderer";
import { createFallbackSphere } from "../utils/createFallbackSphere";
import { CometRenderer } from "./renderer";

interface CreateCometMeshDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodObject: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates a Comet mesh (an LOD object) using the CometRenderer.
 */
export function createCometMesh(
  object: RenderableCelestialObject,
  deps: CreateCometMeshDeps,
): THREE.Object3D {
  let renderer = deps.celestialRenderers.get(object.celestialObjectId);

  if (!renderer) {
    renderer = new CometRenderer();
    deps.celestialRenderers.set(object.celestialObjectId, renderer);
  }

  if (renderer.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = deps.createLodObject(object, lodLevels);
      return lod;
    } else {
      console.warn(
        `[MeshFactory:Comet] Renderer for ${object.type} ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[MeshFactory:Comet] Renderer for ${object.type} ${object.celestialObjectId} does not have getLODLevels.`,
    );
  }

  return createFallbackSphere(object);
}
