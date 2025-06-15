import {
  CelestialType,
  StarProperties,
  StellarType,
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
import type { CelestialRenderer } from "../base/CelestialRenderer";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { createFallbackSphere } from "../utils/createFallbackSphere";

interface CreateStarMeshDeps {
  starRenderers: Map<string, CelestialRenderer>;
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * Helper function to create the appropriate star renderer based on spectral class or stellar type
 * @param spectralClass The spectral class of the star (O, B, A, F, G, K, M)
 * @param stellarType For exotic objects: StellarType enum value
 * @returns A renderer appropriate for the given spectral class or stellar type
 */
function createStarRenderer(
  spectralClass?: string,
  stellarType?: StellarType,
): BaseStarRenderer {
  if (stellarType) {
    switch (stellarType) {
      case StellarType.NEUTRON_STAR:
        return new NeutronStarRenderer();
      case StellarType.WHITE_DWARF:
        return new WhiteDwarfRenderer();
      case StellarType.WOLF_RAYET:
        return new WolfRayetRenderer();
      case StellarType.BLACK_HOLE:
        return new SchwarzschildBlackHoleRenderer();
      case StellarType.KERR_BLACK_HOLE:
        return new KerrBlackHoleRenderer();
      case StellarType.MAIN_SEQUENCE:
        break;
    }
  }

  switch (spectralClass?.toUpperCase()) {
    case "O":
      return new ClassOStarRenderer();
    case "B":
      return new ClassBStarRenderer();
    case "A":
      return new ClassAStarRenderer();
    case "F":
      return new ClassFStarRenderer();
    case "G":
      return new ClassGStarRenderer();
    case "K":
      return new ClassKStarRenderer();
    case "M":
      return new ClassMStarRenderer();
    default:
      return new MainSequenceStarRenderer();
  }
}

/**
 * @internal
 * Creates a Star mesh (usually an LOD object) using appropriate renderers.
 */
export function createStarMesh(
  object: RenderableCelestialObject,
  deps: CreateStarMeshDeps,
): THREE.Object3D {
  let renderer = deps.starRenderers.get(object.celestialObjectId);

  // If no ID-specific renderer, try to create one
  if (!renderer) {
    if (object.type === CelestialType.STAR && object.properties) {
      const starProps = object.properties as StarProperties;
      try {
        const newRenderer = createStarRenderer(
          starProps.spectralClass,
          starProps.stellarType,
        );
        if (newRenderer) {
          renderer = newRenderer;
          deps.starRenderers.set(object.celestialObjectId, renderer);
        } else {
          console.warn(
            `[MeshFactory:Star] createStarRenderer failed for ${object.celestialObjectId} (Class: ${starProps.spectralClass}, Type: ${starProps.stellarType}).`,
          );
        }
      } catch (error) {
        console.error(
          `[MeshFactory:Star] Error calling createStarRenderer for ${object.celestialObjectId}:`,
          error,
        );
      }
    } else {
      console.warn(
        `[MeshFactory:Star] Missing or invalid properties for STAR ${object.celestialObjectId}. Cannot create specific renderer.`,
      );
    }
  }

  // Attempt to use the found or created renderer
  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      const lod = deps.createLodCallback(object, lodLevels);
      return lod;
    } else {
      console.warn(
        `[MeshFactory:Star] Renderer for STAR ${object.celestialObjectId} provided invalid LOD levels.`,
      );
    }
  } else {
    if (renderer) {
      console.warn(
        `[MeshFactory:Star] Renderer found for STAR ${object.celestialObjectId} but it lacks getLODLevels.`,
      );
    } else {
      console.warn(
        `[MeshFactory:Star] No suitable renderer found or created for STAR ${object.celestialObjectId}.`,
      );
    }
  }

  return createFallbackSphere(object);
}
