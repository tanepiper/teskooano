import { GasGiantClass, GasGiantProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import type { CelestialRenderer } from "../base/CelestialRenderer";
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
  let renderer = deps.celestialRenderers.get(object.celestialObjectId) as
    | BaseGasGiantRenderer
    | undefined;

  if (!renderer) {
    const properties = object.properties as GasGiantProperties | undefined;
    const gasGiantClass = properties?.planetType;

    if (!gasGiantClass) {
      console.warn(
        `[MeshFactory:GasGiant] Missing or invalid gasGiantClass for ${object.celestialObjectId}. Using fallback.`,
      );
      return createFallbackSphere(object);
    }

    let newRenderer: BaseGasGiantRenderer;

    switch (gasGiantClass) {
      case GasGiantClass.CLASS_I:
        newRenderer = new ClassIGasGiantRenderer();
        break;
      case GasGiantClass.CLASS_II:
        newRenderer = new ClassIIGasGiantRenderer();
        break;
      case GasGiantClass.CLASS_III:
        newRenderer = new ClassIIIGasGiantRenderer();
        break;
      case GasGiantClass.CLASS_IV:
        newRenderer = new ClassIVGasGiantRenderer();
        break;
      case GasGiantClass.CLASS_V:
        newRenderer = new ClassVGasGiantRenderer();
        break;
      default:
        console.warn(
          `[MeshFactory:GasGiant] Unknown gasGiantClass: ${gasGiantClass} for ${object.celestialObjectId}. Using fallback.`,
        );
        return createFallbackSphere(object);
    }

    // Initialize the renderer to create rings if they exist.
    newRenderer.initialize(object);
    deps.celestialRenderers.set(object.celestialObjectId, newRenderer);
    renderer = newRenderer;
  }

  const lodLevels = renderer.getLODLevels(object);
  if (lodLevels && lodLevels.length > 0) {
    const lod = deps.createLodCallback(object, lodLevels);
    return lod;
  } else {
    console.warn(
      `[MeshFactory:GasGiant] Renderer for ${object.celestialObjectId} provided invalid LOD levels.`,
    );
  }

  return createFallbackSphere(object);
}
