import { CelestialType, PlanetProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  BaseTerrestrialRenderer,
  type CelestialRenderer,
} from "@teskooano/systems-celestial";
import type { LODLevel } from "@teskooano/renderer-threejs-effects";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";

interface CreateMoonMeshDeps {
  moonRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates a Moon mesh (usually an LOD object) using appropriate renderers.
 */
export function createMoonMesh(
  object: RenderableCelestialObject,
  deps: CreateMoonMeshDeps,
): THREE.Object3D {
  let renderer = deps.moonRenderers.get(object.celestialObjectId);

  if (!renderer) {
    try {
      // Assuming moons use the same default terrestrial renderer as planets
      renderer = new BaseTerrestrialRenderer();
      if (renderer) {
        deps.moonRenderers.set(object.celestialObjectId, renderer);
      }
    } catch (error) {
      console.error(
        `[MeshFactory:Moon] Failed to create default BaseTerrestrialRenderer for ${object.celestialObjectId}:`,
        error,
      );
    }
  }

  if (!renderer) {
    console.error(
      `[MeshFactory:Moon] Failed to find or create renderer for ${object.celestialObjectId}.`,
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
        `[MeshFactory:Moon] Renderer for ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[MeshFactory:Moon] Renderer for ${object.celestialObjectId} does not have getLODLevels.`,
    );
  }

  return createFallbackSphere(object);
}
