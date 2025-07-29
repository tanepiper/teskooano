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

// Mature Stars - Post-Main Sequence Evolution
import { SubgiantRenderer } from "./mature-stars/subgiant/subgiant";
import { RedGiantRenderer } from "./mature-stars/red-giant/red-giant";
import { HorizontalBranchRenderer } from "./mature-stars/horizontal-branch/horizontal-branch";
import { AGBRenderer } from "./mature-stars/asymptotic-giant-branch/agb";
import { PostAGBRenderer } from "./mature-stars/post-agb/post-agb";
import { SupergiantRenderer } from "./mature-stars/supergiant/supergiant";
import { HypergiantRenderer } from "./mature-stars/supergiant/hypergiant";
import { WolfRayetRenderer } from "./mature-stars/supergiant/wolf-rayet";

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
  object: RenderableCelestialObject,
  spectralClass?: string,
  stellarType?: StellarType,
  neutronStarSubtype?: NeutronStarSubtype,
  blackHoleSubtype?: BlackHoleSubtype,
  whiteDwarfSubtype?: WhiteDwarfSubtype,
  protostarSubtype?: ProtostarSubtype,
  lightingManager?: LightingManager,
): BaseStarRenderer {
  if (stellarType) {
    const rendererOptions = { lightingManager };
    switch (stellarType) {
      // Stellar Remnants
      case StellarType.NEUTRON_STAR:
        // Use subtype to determine neutron star renderer behavior
        return new NeutronStarRenderer(object, {
          ...rendererOptions,
          subtype: neutronStarSubtype,
        });
      case StellarType.WHITE_DWARF:
        // Use subtype to determine white dwarf renderer behavior
        return new WhiteDwarfRenderer(object, {
          ...rendererOptions,
          subtype: whiteDwarfSubtype,
        });
      case StellarType.BLACK_HOLE:
        // Use subtype to determine which black hole renderer
        if (blackHoleSubtype === BlackHoleSubtype.KERR) {
          return new KerrBlackHoleRenderer(object, rendererOptions);
        } else {
          return new SchwarzschildBlackHoleRenderer(object, rendererOptions);
        }

      // Mature Stars - Post-Main Sequence Evolution
      case StellarType.SUBGIANT:
        return new SubgiantRenderer(object, rendererOptions);
      case StellarType.RED_GIANT:
        return new RedGiantRenderer(object, rendererOptions);
      case StellarType.HORIZONTAL_BRANCH:
        return new HorizontalBranchRenderer(object, rendererOptions);
      case StellarType.ASYMPTOTIC_GIANT_BRANCH:
        return new AGBRenderer(object, rendererOptions);
      case StellarType.POST_AGB:
        return new PostAGBRenderer(object, rendererOptions);
      case StellarType.SUPERGIANT:
        return new SupergiantRenderer(object, rendererOptions);

      // Special Types
      case StellarType.WOLF_RAYET:
        return new WolfRayetRenderer(object, rendererOptions);
      case StellarType.HYPERGIANT:
        return new HypergiantRenderer(object, rendererOptions);

      // Young Stars
      case StellarType.PROTOSTAR:
      case StellarType.PRE_MAIN_SEQUENCE:
        // Use main sequence renderer with special parameters for young stars
        return new MainSequenceStarRenderer(object, rendererOptions);
      case StellarType.MAIN_SEQUENCE:
        break;
    }
  }

  const rendererOptions = { lightingManager };
  switch (spectralClass?.toUpperCase()) {
    case "O":
      return new ClassOStarRenderer(object, rendererOptions);
    case "B":
      return new ClassBStarRenderer(object, rendererOptions);
    case "A":
      return new ClassAStarRenderer(object, rendererOptions);
    case "F":
      return new ClassFStarRenderer(object, rendererOptions);
    case "G":
      return new ClassGStarRenderer(object, rendererOptions);
    case "K":
      return new ClassKStarRenderer(object, rendererOptions);
    case "M":
      return new ClassMStarRenderer(object, rendererOptions);
    default:
      return new MainSequenceStarRenderer(object, rendererOptions);
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
          object,
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
