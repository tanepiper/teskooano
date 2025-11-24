import type {
  GasGiantProperties,
  RenderableCelestialObject,
  RendererBackend,
} from "@teskooano/data-types";
import { CelestialType, GasGiantClass } from "@teskooano/data-types";
import {
  type LODLevel,
  createFallbackSphere,
  type CelestialRenderer,
} from "@teskooano/renderer-threejs-celestial";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";
import { ClassIGasGiantRenderer } from "./class-i";
import { ClassIIGasGiantRenderer } from "./class-ii";
import { ClassIIIGasGiantRenderer } from "./class-iii";
import { ClassIVGasGiantRenderer } from "./class-iv";
import { ClassVGasGiantRenderer } from "./class-v";
import { BaseGasGiantRenderer } from "./base";

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
  /** Active renderer backend ('webgpu' or 'webgl') */
  rendererBackend: RendererBackend;
  /** Enable debug mode for additional logging and fallback usage */
  debug?: boolean;
}

/**
 * Creates a Gas Giant mesh with unified API
 */
export function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  const {
    celestialRenderers,
    createLodObject,
    lightingManager,
    debug = false,
  } = options;

  if (debug) {
    console.debug(`[GasGiant:createMesh] Creating mesh for ${object.id}`);
  }

  // Force fallback if debug mode is enabled
  if (debug) {
    console.debug(
      `[GasGiant:createMesh] Debug mode enabled, using fallback for ${object.id}`,
    );
    return createFallbackSphere(object);
  }

  let renderer = celestialRenderers.get(object.id) as
    | BaseGasGiantRenderer
    | undefined;

  if (!renderer) {
    const properties = object.properties as GasGiantProperties;
    const gasGiantClass = properties.classType;
    const rendererDeps = {
      celestialRenderers,
      lightingManager,
      rendererBackend: options.rendererBackend,
    };

    let newRenderer: BaseGasGiantRenderer;

    try {
      switch (gasGiantClass) {
        case GasGiantClass.CLASS_I:
          newRenderer = new ClassIGasGiantRenderer(object, rendererDeps);
          break;
        case GasGiantClass.CLASS_II:
          newRenderer = new ClassIIGasGiantRenderer(object, rendererDeps);
          break;
        case GasGiantClass.CLASS_III:
          newRenderer = new ClassIIIGasGiantRenderer(object, rendererDeps);
          break;
        case GasGiantClass.CLASS_IV:
          newRenderer = new ClassIVGasGiantRenderer(object, rendererDeps);
          break;
        case GasGiantClass.CLASS_V:
          newRenderer = new ClassVGasGiantRenderer(object, rendererDeps);
          break;
        default:
          console.warn(
            `[GasGiant:createMesh] Unknown gasGiantClass: ${gasGiantClass} for ${object.id}. Using fallback.`,
          );
          return createFallbackSphere(object);
      }

      renderer = newRenderer;
      celestialRenderers.set(object.id, renderer);

      if (debug) {
        console.debug(
          `[GasGiant:createMesh] Created new ${gasGiantClass} renderer for ${object.id}`,
        );
      }
    } catch (error) {
      console.error(
        `[GasGiant:createMesh] Failed to create renderer for ${object.id}:`,
        error,
      );
      return createFallbackSphere(object);
    }
  }

  const lodLevels = renderer.getLODLevels(object);
  if (lodLevels && lodLevels.length > 0) {
    const lod = createLodObject(object, lodLevels);

    // Register ring shadow casters if the object has rings and we have a lighting manager
    if (options.lightingManager) {
      renderer.registerRingShadowCasters(options.lightingManager, object);
    }

    if (debug) {
      console.debug(
        `[GasGiant:createMesh] Created LOD with ${lodLevels.length} levels for ${object.id}`,
      );
    }

    return lod;
  }

  console.warn(
    `[GasGiant:createMesh] Renderer for ${object.id} provided no valid LOD levels. Using fallback.`,
  );
  return createFallbackSphere(object);
}
