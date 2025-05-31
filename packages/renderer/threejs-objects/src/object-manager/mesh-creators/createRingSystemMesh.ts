import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  RingSystemRenderer,
  type LODLevel,
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";
import { CreatorDependencies } from "../../types";

/**
 * @internal
 * Creates a Ring System mesh, typically managed via a THREE.LOD object.
 *
 * This function attempts to retrieve an existing `RingSystemRenderer` for the object from the cache.
 * If not found, it creates a new one by instantiating `RingSystemRenderer`.
 * The visual representation of the ring system is obtained via the renderer's `getLODLevels` method.
 * Even if a ring system has only one effective level of detail, it should be provided via this method.
 *
 * If a renderer is successfully obtained and provides valid LOD levels, an LOD mesh is constructed.
 * If any step fails, this function currently falls back to creating a default sphere,
 * which is NOT ideal for rings. A TODO is in place to implement a better fallback.
 *
 * @param object - The renderable celestial object that owns the ring system.
 *                 The ring properties are expected to be part of this object.
 * @param deps - Dependencies including the renderer cache and LOD creation callback.
 * @returns A THREE.Object3D (usually a THREE.LOD) representing the ring system or a fallback sphere (placeholder).
 */
export function createRingSystemMesh(
  object: RenderableCelestialObject,
  deps: CreatorDependencies,
): THREE.Object3D {
  let renderer = deps.ringSystemRenderers.get(object.celestialObjectId);

  if (!renderer) {
    try {
      const newRenderer = new RingSystemRenderer();
      renderer = newRenderer;
      deps.ringSystemRenderers.set(object.celestialObjectId, renderer);
    } catch (error) {
      console.error(
        `[MeshFactory:RingSystem] Error instantiating RingSystemRenderer for ${object.celestialObjectId}:`,
        error,
      );
      // Fallback will be used due to error
    }
  }

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      return deps.createLodCallback(object, lodLevels);
    }
    console.warn(
      `[MeshFactory:RingSystem] Renderer for ${object.celestialObjectId} provided no valid LOD levels. Using fallback (sphere).`,
    );
  } else if (renderer) {
    // This case implies a renderer was created but lacks the getLODLevels method, which is unexpected for CelestialRenderers.
    console.warn(
      `[MeshFactory:RingSystem] Renderer for ${object.celestialObjectId} (RingSystemRenderer) lacks getLODLevels method. Using fallback (sphere).`,
    );
  } else {
    // This implies renderer is still undefined after attempting creation, so instantiation must have failed.
    console.warn(
      `[MeshFactory:RingSystem] No suitable renderer found or created for ${object.celestialObjectId}. Using fallback (sphere).`,
    );
  }

  // TODO: Implement a better fallback for rings than a sphere.
  console.warn(
    `[MeshFactory:RingSystem] Fallback sphere used for ring system ${object.celestialObjectId}. This should be improved.`,
  );
  return createFallbackSphere(object);
}
