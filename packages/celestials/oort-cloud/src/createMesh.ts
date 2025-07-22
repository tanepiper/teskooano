import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  createFallbackSphere,
  type CelestialRenderer,
} from "@teskooano/renderer-threejs-celestial";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";
import { OortCloudRenderer } from "./renderer";

/**
 * Unified interface for celestial mesh creation dependencies
 */
export interface CreateMeshOptions {
  /** Map to store and cache renderer instances */
  celestialRenderers: Map<string, CelestialRenderer>;
  /** Function to create LOD objects from levels */
  createLodObject: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  /** Lighting manager for advanced rendering */
  lightingManager?: LightingManager;
  /** Enable debug mode for additional logging and fallback usage */
  debug?: boolean;
}

/**
 * Creates an Oort Cloud mesh with unified API
 */
export function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  const { celestialRenderers, createLodObject, debug = false } = options;

  // Force fallback if debug mode is enabled
  if (debug) {
    return createFallbackSphere(object);
  }

  let renderer = celestialRenderers.get(object.celestialObjectId) as
    | OortCloudRenderer
    | undefined;

  if (!renderer) {
    try {
      renderer = new OortCloudRenderer(object);
      celestialRenderers.set(object.celestialObjectId, renderer);
    } catch (error) {
      return createFallbackSphere(object);
    }
  }

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = createLodObject(object, lodLevels);

      return lod;
    }
  }

  return createFallbackSphere(object);
}
