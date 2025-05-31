import { GasGiantClass, GasGiantProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  type CelestialRenderer,
  ClassIGasGiantRenderer,
  ClassIIGasGiantRenderer,
  ClassIIIGasGiantRenderer,
  ClassIVGasGiantRenderer,
  ClassVGasGiantRenderer,
} from "@teskooano/systems-celestial";
import * as THREE from "three";
import { CreatorDependencies } from "../../types";
import { createFallbackSphere } from "./createFallbackSphere";

/**
 * @internal
 * Creates a Gas Giant mesh, typically a THREE.LOD object, by instantiating a specialized renderer.
 *
 * This function determines the appropriate renderer based on the gas giant's class
 * (e.g., "Class I", "Class II") from its properties, then instantiates that renderer directly.
 *
 * If a suitable renderer can be instantiated and provides valid LOD levels, an LOD mesh is constructed.
 * Otherwise, it logs a warning and falls back to creating a default sphere mesh.
 *
 * @param object - The renderable celestial object representing the gas giant.
 *                 Its `properties.gasGiantClass` is used to determine the renderer.
 * @param deps - Dependencies including the LOD creation callback.
 * @returns A THREE.Object3D (usually a THREE.LOD) for the gas giant or a fallback sphere.
 */
export function createGasGiantMesh(
  object: RenderableCelestialObject,
  deps: CreatorDependencies,
): THREE.Object3D {
  const properties = object.properties as GasGiantProperties | undefined;
  const gasGiantType = properties?.gasGiantClass;

  if (!gasGiantType) {
    console.warn(
      `[MeshFactory:GasGiant] Missing or invalid gasGiantClass for ${object.celestialObjectId}. Using fallback.`,
    );
    return createFallbackSphere(object);
  }

  let renderer: CelestialRenderer | undefined;

  switch (gasGiantType) {
    case GasGiantClass.CLASS_I:
      renderer = new ClassIGasGiantRenderer();
      break;
    case GasGiantClass.CLASS_II:
      renderer = new ClassIIGasGiantRenderer();
      break;
    case GasGiantClass.CLASS_III:
      renderer = new ClassIIIGasGiantRenderer();
      break;
    case GasGiantClass.CLASS_IV:
      renderer = new ClassIVGasGiantRenderer();
      break;
    case GasGiantClass.CLASS_V:
      renderer = new ClassVGasGiantRenderer();
      break;
    default:
      console.warn(
        `[MeshFactory:GasGiant] Unknown gasGiantClass '${gasGiantType}' for ${object.celestialObjectId}. Using fallback.`,
      );
      return createFallbackSphere(object);
  }

  if (renderer?.getLODLevels) {
    const lodLevels = renderer.getLODLevels(object);
    if (lodLevels && lodLevels.length > 0) {
      return deps.createLodCallback(object, lodLevels);
    }
    console.warn(
      `[MeshFactory:GasGiant] Renderer for ${object.celestialObjectId} (Class: ${gasGiantType}) provided no valid LOD levels. Using fallback.`,
    );
  } else {
    // This case should ideally not be reached if the switch statement covers all valid renderers
    // and those renderers are correctly implemented with getLODLevels.
    console.warn(
      `[MeshFactory:GasGiant] Renderer for ${object.celestialObjectId} (Class: ${gasGiantType}) is missing or lacks getLODLevels method. Using fallback.`,
    );
  }

  return createFallbackSphere(object);
}
