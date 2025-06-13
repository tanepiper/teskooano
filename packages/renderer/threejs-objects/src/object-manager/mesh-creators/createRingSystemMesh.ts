import { CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { RingSystemRenderer } from "@teskooano/systems-celestial";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";

interface CreateRingSystemMeshDeps {
  ringSystemRenderers: Map<string, RingSystemRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates a Ring System mesh (usually an LOD object).
 */
export function createRingSystemMesh(
  object: RenderableCelestialObject,
  deps: CreateRingSystemMeshDeps,
): THREE.Object3D {
  let renderer = deps.ringSystemRenderers.get(object.celestialObjectId);

  if (!renderer) {
    try {
      renderer = new RingSystemRenderer();
      if (renderer) {
        deps.ringSystemRenderers.set(object.celestialObjectId, renderer);
      }
    } catch (error) {
      console.error(
        `[MeshFactory:Ring] Failed to create default RingSystemRenderer for ${object.celestialObjectId}:`,
        error,
      );
    }
  }

  if (!renderer) {
    console.error(
      `[MeshFactory:Ring] Failed to find or create renderer for ${object.celestialObjectId}.`,
    );
    return createFallbackSphere(object);
  }

  if (renderer.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = deps.createLodCallback(object, lodLevels);
      return lod;
    } else {
      console.warn(
        `[MeshFactory:Ring] Renderer for ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[MeshFactory:Ring] Renderer for ${object.celestialObjectId} does not have getLODLevels.`,
    );
  }

  return createFallbackSphere(object);
}
