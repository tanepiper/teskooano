import { GasGiantClass, GasGiantProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { CelestialRenderer } from "../base/CelestialRenderer";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { createFallbackSphere } from "../utils/createFallbackSphere";
import { BaseGasGiantRenderer } from "./base";
import { ClassIGasGiantRenderer } from "./class-i";
import { ClassIIGasGiantRenderer } from "./class-ii";
import { ClassIIIGasGiantRenderer } from "./class-iii";
import { ClassIVGasGiantRenderer } from "./class-iv";
import { ClassVGasGiantRenderer } from "./class-v";

interface CreateGasGiantMeshDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Creates a Gas Giant mesh (usually an LOD object) using appropriate renderers.
 */
export function createGasGiantMesh(
  object: RenderableCelestialObject,
  deps: CreateGasGiantMeshDeps,
): THREE.Object3D {
  const properties = object.properties as GasGiantProperties | undefined;
  const rendererKey = properties?.gasGiantClass;

  if (!rendererKey) {
    console.warn(
      `[MeshFactory:GasGiant] Missing or invalid gasGiantClass for ${object.celestialObjectId}. Using fallback.`,
    );
    return createFallbackSphere(object);
  }

  let renderer: BaseGasGiantRenderer;

  switch (rendererKey) {
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
        `[MeshFactory:GasGiant] Unknown gasGiantClass: ${rendererKey} for ${object.celestialObjectId}. Using fallback.`,
      );
      return createFallbackSphere(object);
  }

  // Initialize the renderer to create rings if they exist.
  renderer.initialize(object);

  const lodLevels = renderer.getLODLevels(object);
  if (lodLevels && lodLevels.length > 0) {
    const lod = deps.createLodCallback(object, lodLevels);
    return lod;
  } else {
    console.warn(
      `[MeshFactory:GasGiant] Renderer for ${object.celestialObjectId} (Key: ${rendererKey}) provided invalid LOD levels.`,
    );
  }

  return createFallbackSphere(object);
}
