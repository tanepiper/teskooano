import {
  CelestialType,
  MainSequenceSpectralClass,
  StarProperties,
  StellarType,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { createStarRenderer } from "@teskooano/systems-celestial";
import * as THREE from "three";
import { CreatorDependencies } from "../../types";
import { createFallbackSphere } from "./createFallbackSphere";

/**
 * @internal
 * Creates a Star mesh, typically a THREE.LOD object, by utilizing an appropriate star renderer.
 *
 * This function attempts to find an existing renderer for the given star object. If not found,
 * it tries to create a new one based on the star's properties (type, spectral class).
 * If a renderer is successfully obtained and provides valid LOD levels, an LOD mesh is created.
 * Otherwise, it logs warnings and defaults to creating a fallback sphere.
 *
 * @param object - The renderable celestial object representing the star.
 * @param deps - An object containing dependencies like renderer caches and LOD creation callbacks.
 * @returns A THREE.Object3D representing the star mesh (often a THREE.LOD) or a fallback sphere.
 */
export function createStarMesh(
  object: RenderableCelestialObject,
  deps: CreatorDependencies,
): THREE.Object3D {
  let renderer = deps.starRenderers.get(object.celestialObjectId);

  // If no ID-specific renderer, try to create one based on star properties
  if (!renderer) {
    if (object.type === CelestialType.STAR && object.properties) {
      const starProps = object.properties as StarProperties;
      try {
        const newRenderer = createStarRenderer(
          object,
          starProps.stellarType,
          undefined, // No specific subtype for general star creation here
          starProps.stellarType === StellarType.MAIN_SEQUENCE
            ? (starProps.spectralClass as MainSequenceSpectralClass)
            : undefined,
        );
        if (newRenderer) {
          renderer = newRenderer;
          deps.starRenderers.set(object.celestialObjectId, renderer);
        } else {
          console.warn(
            `[MeshFactory:Star] createStarRenderer returned null for ${object.celestialObjectId} (Class: ${starProps.spectralClass}, Type: ${starProps.stellarType}). Using fallback.`, // Added fallback info
          );
        }
      } catch (error) {
        console.error(
          `[MeshFactory:Star] Error calling createStarRenderer for ${object.celestialObjectId}:`, // Added colon
          error,
        );
        // Fallback will be used due to error
      }
    } else if (object.type === CelestialType.STAR) {
      // Handle cases where it's a star but properties might be missing or invalid for renderer creation
      console.warn(
        `[MeshFactory:Star] Missing or invalid properties for STAR ${object.celestialObjectId}. Cannot create specific renderer. Using fallback.`, // Added fallback info
      );
    }
    // If not a STAR type or properties are missing, renderer remains undefined, leading to fallback
  }

  // Attempt to use the found or created renderer to get LOD levels
  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      // Successfully obtained LOD levels, create and return the LOD object
      return deps.createLodCallback(object, lodLevels);
    } else {
      console.warn(
        `[MeshFactory:Star] Renderer for STAR ${object.celestialObjectId} provided no valid LOD levels. Using fallback.`, // Added fallback info
      );
    }
  } else {
    if (renderer) {
      // This case should ideally not happen if createStarRenderer guarantees a getLODLevels method
      console.warn(
        `[MeshFactory:Star] Renderer found for STAR ${object.celestialObjectId} but it lacks getLODLevels. Using fallback.`, // Added fallback info
      );
    } else if (object.type === CelestialType.STAR) {
      // Only log this specific warning if we expected to find/create a renderer for a STAR
      // This avoids spamming if this function was called for a non-star by mistake (though typing should prevent that)
      console.warn(
        `[MeshFactory:Star] No suitable renderer found or created for STAR ${object.celestialObjectId}. Using fallback.`, // Added fallback info
      );
    }
  }

  // If all attempts to use a specific renderer fail, create a fallback sphere
  return createFallbackSphere(object);
}
