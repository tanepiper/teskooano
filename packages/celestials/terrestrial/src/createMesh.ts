import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import {
  createFallbackSphere,
  LODLevel,
} from "@teskooano/renderer-threejs-celestial";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { BaseTerrestrialRenderer } from "./renderer";
import * as THREE from "three";

// RendererBackend removed - WebGPU only

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
  /** Active renderer backend (webgpu or webgl) */
  // rendererBackend removed - WebGPU only
  /** Enable debug mode for additional logging and fallback usage */
  debug?: boolean;
}

/**
 * Creates a terrestrial object mesh (planet or moon) with unified API
 */
export function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  const { celestialRenderers, createLodObject, debug = false } = options;

  if (debug) {
    console.debug(
      `[Terrestrial:createMesh] Creating mesh for ${object.type} ${object.id}`,
    );
  }

  // Force fallback if debug mode is enabled
  if (debug) {
    console.debug(
      `[Terrestrial:createMesh] Debug mode enabled, using fallback for ${object.id}`,
    );
    return createFallbackSphere(object);
  }

  let renderer = celestialRenderers.get(object.id) as
    | BaseTerrestrialRenderer
    | undefined;

  if (!renderer) {
    try {
      renderer = new BaseTerrestrialRenderer(object, {
        renderers: celestialRenderers,
      });
      celestialRenderers.set(object.id, renderer);

      if (debug) {
        console.debug(
          `[Terrestrial:createMesh] Created new WebGPU renderer for ${object.type} ${object.id}`,
        );
      }
    } catch (error) {
      console.error(
        `[Terrestrial:createMesh] Failed to create default BaseTerrestrialRenderer for ${object.id}:`,
        error,
      );
      return createFallbackSphere(object);
    }
  }

  if (!renderer) {
    console.error(
      `[Terrestrial:createMesh] Failed to find or create renderer for ${object.id}.`,
    );
    return createFallbackSphere(object);
  }

  if (renderer.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = createLodObject(object, lodLevels);

      // Register ring shadow casters if the object has rings and we have a lighting manager
      if (options.lightingManager) {
        renderer.registerRingShadowCasters(options.lightingManager, object);
      }

      if (debug) {
        console.debug(
          `[Terrestrial:createMesh] Created LOD with ${lodLevels.length} levels for ${object.type} ${object.id}`,
        );
      }

      return lod;
    } else {
      console.warn(
        `[Terrestrial:createMesh] Renderer for ${object.type} ${object.id} provided invalid LOD levels.`,
      );
    }
  } else {
    console.warn(
      `[Terrestrial:createMesh] Renderer for ${object.type} ${object.id} does not have getLODLevels.`,
    );
  }

  return createFallbackSphere(object);
}

// Backward compatibility functions
export function createPlanetMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  return createMesh(object, options);
}

export function createMoonMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  return createMesh(object, options);
}
