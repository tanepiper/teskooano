import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  BaseTerrestrialRenderer,
  type CelestialRenderer,
  type LODLevel,
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";

interface CreatePlanetMeshDeps {
  planetRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates a Planet or Dwarf Planet mesh (usually an LOD object) using appropriate renderers.
 */
export function createPlanetMesh(
  object: RenderableCelestialObject,
  deps: CreatePlanetMeshDeps,
): THREE.Object3D {
  let renderer = deps.planetRenderers.get(object.celestialObjectId);

  if (!renderer) {
    try {
      renderer = new BaseTerrestrialRenderer();
      if (renderer) {
        deps.planetRenderers.set(object.celestialObjectId, renderer);
      }
    } catch (error) {
      console.error(
        `[MeshFactory:Planet] Failed to create default BaseTerrestrialRenderer for ${object.celestialObjectId}:`,
        error,
      );
      // Fall through, renderer will be undefined
    }
  }

  if (!renderer) {
    console.error(
      `[MeshFactory:Planet] Failed to find or create renderer for ${object.celestialObjectId}.`,
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
        `[MeshFactory:Planet] Renderer for ${object.type} ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[MeshFactory:Planet] Renderer for ${object.type} ${object.celestialObjectId} does not have getLODLevels.`,
    );
  }

  return createFallbackSphere(object);
}
