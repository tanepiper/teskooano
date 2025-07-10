import {
  GasGiantClass,
  GasGiantProperties,
  type RenderableCelestialObject,
} from "@teskooano/data-types";
import { type LODLevel } from "@teskooano/renderer-threejs-lod";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";
import type { BaseGasGiantRenderer } from "./base";
import { ClassIGasGiantRenderer } from "./class-i";
import { ClassIIGasGiantRenderer } from "./class-ii";
import { ClassIIIGasGiantRenderer } from "./class-iii";
import { ClassIVGasGiantRenderer } from "./class-iv";
import { ClassVGasGiantRenderer } from "./class-v";
import {
  createFallbackSphere,
  type CelestialRenderer,
} from "@teskooano/renderer-threejs-celestial";

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
    console.debug(
      `[GasGiant:createMesh] Creating mesh for ${object.celestialObjectId}`,
    );
  }

  // Force fallback if debug mode is enabled
  if (debug) {
    console.debug(
      `[GasGiant:createMesh] Debug mode enabled, using fallback for ${object.celestialObjectId}`,
    );
    return createFallbackSphere(object);
  }

  let renderer = celestialRenderers.get(object.celestialObjectId) as
    | BaseGasGiantRenderer
    | undefined;

  if (!renderer) {
    const properties = object.properties as GasGiantProperties;
    const gasGiantClass = properties.classType;
    const rendererDeps = {
      celestialRenderers,
      lightingManager,
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
            `[GasGiant:createMesh] Unknown gasGiantClass: ${gasGiantClass} for ${object.celestialObjectId}. Using fallback.`,
          );
          return createFallbackSphere(object);
      }

      renderer = newRenderer;
      celestialRenderers.set(object.celestialObjectId, renderer);

      if (debug) {
        console.debug(
          `[GasGiant:createMesh] Created new ${gasGiantClass} renderer for ${object.celestialObjectId}`,
        );
      }
    } catch (error) {
      console.error(
        `[GasGiant:createMesh] Failed to create renderer for ${object.celestialObjectId}:`,
        error,
      );
      return createFallbackSphere(object);
    }
  }

  const lodLevels = renderer.getLODLevels(object);
  if (lodLevels && lodLevels.length > 0) {
    const lod = createLodObject(object, lodLevels);

    if (debug) {
      console.debug(
        `[GasGiant:createMesh] Created LOD with ${lodLevels.length} levels for ${object.celestialObjectId}`,
      );
    }

    return lod;
  }

  console.warn(
    `[GasGiant:createMesh] Renderer for ${object.celestialObjectId} provided no valid LOD levels. Using fallback.`,
  );
  return createFallbackSphere(object);
}
