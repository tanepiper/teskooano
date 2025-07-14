import {
  CelestialType,
  StarProperties,
  StellarType,
  NeutronStarSubtype,
  BlackHoleSubtype,
  WhiteDwarfSubtype,
  ProtostarSubtype,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "./base/base-star";
import { MainSequenceStarRenderer } from "./main-sequence/main-sequence-star";
import { ClassOStarRenderer } from "./main-sequence/class-o";
import { ClassBStarRenderer } from "./main-sequence/class-b";
import { ClassAStarRenderer } from "./main-sequence/class-a";
import { ClassFStarRenderer } from "./main-sequence/class-f";
import { ClassGStarRenderer } from "./main-sequence/class-g";
import { ClassKStarRenderer } from "./main-sequence/class-k";
import { ClassMStarRenderer } from "./main-sequence/class-m";
import { NeutronStarRenderer } from "./remnants/neutron-star";
import { WhiteDwarfRenderer } from "./remnants/white-dwarf";
import { WolfRayetRenderer } from "./post-main-sequence/wolf-rayet";
import { SchwarzschildBlackHoleRenderer } from "./black-holes/schwarzschild-black-hole";
import { KerrBlackHoleRenderer } from "./black-holes/kerr-black-hole";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";
import {
  CelestialRenderer,
  createFallbackSphere,
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
 * Helper function to create the appropriate star renderer based on spectral class or stellar type
 */
function createStarRenderer(
  spectralClass?: string,
  stellarType?: StellarType,
  neutronStarSubtype?: NeutronStarSubtype,
  blackHoleSubtype?: BlackHoleSubtype,
  whiteDwarfSubtype?: WhiteDwarfSubtype,
  protostarSubtype?: ProtostarSubtype,
  lightingManager?: LightingManager,
): BaseStarRenderer {
  if (stellarType) {
    const options = { lightingManager };
    switch (stellarType) {
      case StellarType.NEUTRON_STAR:
        // Use subtype to determine neutron star renderer behavior
        return new NeutronStarRenderer({
          ...options,
          subtype: neutronStarSubtype,
        });
      case StellarType.WHITE_DWARF:
        // Use subtype to determine white dwarf renderer behavior
        return new WhiteDwarfRenderer({
          ...options,
          subtype: whiteDwarfSubtype,
        });
      case StellarType.WOLF_RAYET:
        return new WolfRayetRenderer(options);
      case StellarType.HYPERGIANT:
        // For now, use main sequence renderer with enhanced parameters
        return new MainSequenceStarRenderer(options);
      case StellarType.PROTOSTAR:
      case StellarType.PRE_MAIN_SEQUENCE:
        // Use main sequence renderer with special parameters for young stars
        return new MainSequenceStarRenderer(options);
      case StellarType.BLACK_HOLE:
        // Use subtype to determine which black hole renderer
        if (blackHoleSubtype === BlackHoleSubtype.KERR) {
          return new KerrBlackHoleRenderer(options);
        } else {
          return new SchwarzschildBlackHoleRenderer(options);
        }
      case StellarType.MAIN_SEQUENCE:
        break;
    }
  }

  const options = { lightingManager };
  switch (spectralClass?.toUpperCase()) {
    case "O":
      return new ClassOStarRenderer(options);
    case "B":
      return new ClassBStarRenderer(options);
    case "A":
      return new ClassAStarRenderer(options);
    case "F":
      return new ClassFStarRenderer(options);
    case "G":
      return new ClassGStarRenderer(options);
    case "K":
      return new ClassKStarRenderer(options);
    case "M":
      return new ClassMStarRenderer(options);
    default:
      return new MainSequenceStarRenderer(options);
  }
}

/**
 * Creates a Star mesh with unified API
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
      `[Star:createMesh] Creating mesh for ${object.celestialObjectId}`,
    );
  }

  // Force fallback if debug mode is enabled
  if (debug) {
    console.debug(
      `[Star:createMesh] Debug mode enabled, using fallback for ${object.celestialObjectId}`,
    );
    return createFallbackSphere(object);
  }

  let renderer = celestialRenderers.get(object.celestialObjectId);

  // If no ID-specific renderer, try to create one
  if (!renderer) {
    if (object.type === CelestialType.STAR && object.properties) {
      const starProps = object.properties as StarProperties;
      try {
        const newRenderer = createStarRenderer(
          starProps.spectralClass,
          starProps.stellarType,
          starProps.neutronStarSubtype,
          starProps.blackHoleSubtype,
          starProps.whiteDwarfSubtype,
          starProps.protostarSubtype,
          lightingManager,
        );
        if (newRenderer) {
          renderer = newRenderer;
          celestialRenderers.set(object.celestialObjectId, renderer);

          if (debug) {
            console.debug(
              `[Star:createMesh] Created new ${starProps.spectralClass || starProps.stellarType} renderer for ${object.celestialObjectId}`,
            );
          }
        } else {
          console.warn(
            `[Star:createMesh] createStarRenderer failed for ${object.celestialObjectId} (Class: ${starProps.spectralClass}, Type: ${starProps.stellarType}).`,
          );
        }
      } catch (error) {
        console.error(
          `[Star:createMesh] Error calling createStarRenderer for ${object.celestialObjectId}:`,
          error,
        );
      }
    } else {
      console.warn(
        `[Star:createMesh] Missing or invalid properties for STAR ${object.celestialObjectId}. Cannot create specific renderer.`,
      );
    }
  }

  // Attempt to use the found or created renderer
  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = createLodObject(object, lodLevels);
      renderer.initialize(object);

      if (debug) {
        console.debug(
          `[Star:createMesh] Created LOD with ${lodLevels.length} levels for ${object.celestialObjectId}`,
        );
      }

      return lod;
    } else {
      console.warn(
        `[Star:createMesh] Renderer for STAR ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    if (renderer) {
      console.warn(
        `[Star:createMesh] Renderer found for STAR ${object.celestialObjectId} but it lacks getLODLevels.`,
      );
    } else {
      console.warn(
        `[Star:createMesh] No suitable renderer found or created for STAR ${object.celestialObjectId}.`,
      );
    }
  }

  return createFallbackSphere(object);
}
