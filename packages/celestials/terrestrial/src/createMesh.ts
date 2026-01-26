import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { CelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import {
  createFallbackSphere,
  LODLevel,
} from "@teskooano/renderer-threejs-celestial";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import { BaseTerrestrialRenderer } from "./renderer";
import {
  TerrainTextureGenerator,
  type TextureGenerationOptions,
} from "./texture-generation";
import * as THREE from "three";

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
  /**
   * Enable texture-based terrain generation (default: true).
   * When enabled, generates textures with craters, erosion, etc. at creation time.
   * Set to false to use legacy procedural shader-based generation.
   */
  useGeneratedTextures?: boolean;
  /** Options for texture generation (when useGeneratedTextures is true) */
  textureGenerationOptions?: TextureGenerationOptions;
}

/**
 * Creates a terrestrial object mesh (planet or moon) with unified API.
 *
 * Supports two rendering modes:
 * 1. Texture-based (default): Pre-generated textures with craters, erosion, etc.
 * 2. Procedural: Real-time shader-based terrain generation (legacy)
 */
export function createMesh(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): THREE.Object3D {
  const {
    celestialRenderers,
    createLodObject,
    debug = false,
    useGeneratedTextures = true,
  } = options;

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
        useGeneratedTextures,
        textureGenerationOptions: options.textureGenerationOptions,
      });
      celestialRenderers.set(object.id, renderer);

      if (debug) {
        console.debug(
          `[Terrestrial:createMesh] Created new renderer for ${object.type} ${object.id} (textures: ${useGeneratedTextures})`,
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

/**
 * Creates a terrestrial mesh with pre-generated textures.
 *
 * This is an async version that generates textures before creating the mesh.
 * Use this when you want texture-based terrain with craters and erosion.
 *
 * @param object - The celestial object to create
 * @param options - Mesh creation options
 * @returns Promise resolving to the created mesh
 */
export async function createMeshWithTextures(
  object: RenderableCelestialObject,
  options: CreateMeshOptions,
): Promise<THREE.Object3D> {
  const { debug = false } = options;

  if (debug) {
    console.debug(
      `[Terrestrial:createMeshWithTextures] Generating textures for ${object.type} ${object.id}`,
    );
  }

  try {
    // Generate textures asynchronously
    const textures = await TerrainTextureGenerator.generateTextures(
      object,
      options.textureGenerationOptions,
    );

    // Create renderer with pre-generated textures
    const renderer = new BaseTerrestrialRenderer(object, {
      renderers: options.celestialRenderers,
      useGeneratedTextures: true,
      preGeneratedTextures: textures,
    });
    options.celestialRenderers.set(object.id, renderer);

    // Get LOD levels and create mesh
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = options.createLodObject(object, lodLevels);

      if (options.lightingManager) {
        renderer.registerRingShadowCasters(options.lightingManager, object);
      }

      return lod;
    }
  } catch (error) {
    console.error(
      `[Terrestrial:createMeshWithTextures] Failed to generate textures for ${object.id}:`,
      error,
    );
  }

  // Fallback to non-textured creation
  return createMesh(object, { ...options, useGeneratedTextures: false });
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
