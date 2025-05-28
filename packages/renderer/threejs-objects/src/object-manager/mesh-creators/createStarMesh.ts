import {
  CelestialType,
  StarProperties,
  StellarType,
  MainSequenceSpectralClass,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  createStarRenderer,
  type CelestialRenderer,
  type LODLevel,
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";

interface CreateStarMeshDeps {
  starRenderers: Map<string, CelestialRenderer>;
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
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
          object,
          starProps.stellarType,
          undefined,
          starProps.stellarType === StellarType.MAIN_SEQUENCE
            ? (starProps.spectralClass as MainSequenceSpectralClass)
            : undefined,
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
