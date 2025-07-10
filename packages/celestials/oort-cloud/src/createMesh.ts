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

  if (debug) {
    console.debug(
      `[OortCloud:createMesh] Creating mesh for ${object.celestialObjectId}`,
    );
  }

  // Force fallback if debug mode is enabled
  if (debug) {
    console.debug(
      `[OortCloud:createMesh] Debug mode enabled, using fallback for ${object.celestialObjectId}`,
    );
    return createFallbackSphere(object);
  }

  let renderer = celestialRenderers.get(object.celestialObjectId) as
    | OortCloudRenderer
    | undefined;

  if (!renderer) {
    try {
      renderer = new OortCloudRenderer();
      celestialRenderers.set(object.celestialObjectId, renderer);

      if (debug) {
        console.debug(
          `[OortCloud:createMesh] Created new renderer for ${object.celestialObjectId}`,
        );
      }
    } catch (error) {
      console.error(
        `[OortCloud:createMesh] Failed to create renderer for ${object.celestialObjectId}:`,
        error,
      );
      return createFallbackSphere(object);
    }
  }

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = createLodObject(object, lodLevels);

      if (debug) {
        console.debug(
          `[OortCloud:createMesh] Created LOD with ${lodLevels.length} levels for ${object.celestialObjectId}`,
        );
      }

      return lod;
    } else {
      console.warn(
        `[OortCloud:createMesh] Renderer for ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[OortCloud:createMesh] No suitable renderer with getLODLevels found for ${object.celestialObjectId}.`,
    );
  }

  return createFallbackSphere(object);
}
