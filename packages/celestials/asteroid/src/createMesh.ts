import type {
  RenderableCelestialObject,
  RendererBackend,
} from "@teskooano/data-types";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";
import {
  LODLevel,
  createFallbackSphere,
  type CelestialRenderer,
} from "@teskooano/renderer-threejs-celestial";
import { AsteroidRenderer } from "./renderer";

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
  /** Renderer backend (WebGL or WebGPU) */
  rendererBackend: RendererBackend;
}

/**
 * Creates a Asteroid mesh with unified API
 */
export function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  const {
    celestialRenderers,
    createLodObject,
    debug = false,
    rendererBackend,
  } = options;

  if (debug) {
    console.debug(`[Asteroid:createMesh] Creating mesh for ${object.id}`);
  }

  // Force fallback if debug mode is enabled
  if (debug) {
    console.debug(
      `[Asteroid:createMesh] Debug mode enabled, using fallback for ${object.id}`,
    );
    return createFallbackSphere(object);
  }

  let renderer = celestialRenderers.get(object.id) as
    | AsteroidRenderer
    | undefined;

  if (!renderer) {
    try {
      renderer = new AsteroidRenderer(object, rendererBackend);
      celestialRenderers.set(object.id, renderer);

      if (debug) {
        console.debug(
          `[Asteroid:createMesh] Created new renderer for ${object.id}`,
        );
      }
    } catch (error) {
      console.error(
        `[Asteroid:createMesh] Failed to create renderer for ${object.id}:`,
        error,
      );
      return createFallbackSphere(object);
    }
  }

  if (renderer.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = createLodObject(object, lodLevels);

      if (debug) {
        console.debug(
          `[Asteroid:createMesh] Created LOD with ${lodLevels.length} levels for ${object.id}`,
        );
      }

      return lod;
    } else {
      console.warn(
        `[Asteroid:createMesh] Renderer for ${object.type} ${object.id} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[Asteroid:createMesh] Renderer for ${object.type} ${object.id} does not have getLODLevels.`,
    );
  }

  return createFallbackSphere(object);
}
