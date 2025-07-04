import {
  GasGiantClass,
  GasGiantProperties,
  type RenderableCelestialObject,
} from "@teskooano/data-types";
import { type LODLevel } from "@teskooano/renderer-threejs-lod";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";
import type { CelestialRenderer } from "../base/CelestialRenderer";
import { createFallbackSphere } from "../utils/createFallbackSphere";
import type { BaseGasGiantRenderer } from "./base";
import { ClassIGasGiantRenderer } from "./class-i";
import { ClassIIGasGiantRenderer } from "./class-ii";
import { ClassIIIGasGiantRenderer } from "./class-iii";
import { ClassIVGasGiantRenderer } from "./class-iv";
import { ClassVGasGiantRenderer } from "./class-v";

interface MeshFactoryDeps {
  celestialRenderers: Map<string, any>;
  createLodObject: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
  lightingManager: LightingManager;
}

/**
 * @internal
 * Creates a Gas Giant mesh (usually an LOD object) using appropriate renderers.
 */
export function createGasGiantMesh(
  object: RenderableCelestialObject,
  deps: MeshFactoryDeps,
): THREE.Object3D {
  let renderer = deps.celestialRenderers.get(object.celestialObjectId) as
    | BaseGasGiantRenderer
    | undefined;

  if (!renderer) {
    const properties = object.properties as GasGiantProperties;
    const gasGiantClass = properties.classType;
    const rendererDeps = {
      celestialRenderers: deps.celestialRenderers,
      lightingManager: deps.lightingManager,
    };

    let newRenderer: BaseGasGiantRenderer;

    switch (gasGiantClass) {
      case GasGiantClass.CLASS_I:
        newRenderer = new ClassIGasGiantRenderer(object, rendererDeps);
        break;
      case GasGiantClass.CLASS_II:
        newRenderer = new ClassIIGasGiantRenderer(object, rendererDeps);
        break;
      case GasGiantClass.CLASS_III:
        newRenderer = new ClassIIIGasGiantRenderer(object, rendererDeps);
        break;
      case GasGiantClass.CLASS_IV:
        newRenderer = new ClassIVGasGiantRenderer(object, rendererDeps);
        break;
      case GasGiantClass.CLASS_V:
        newRenderer = new ClassVGasGiantRenderer(object, rendererDeps);
        break;
      default:
        console.warn(
          `[MeshFactory:GasGiant] Unknown gasGiantClass: ${gasGiantClass} for ${object.celestialObjectId}. Using fallback.`,
        );
        return createFallbackSphere(object);
    }

    renderer = newRenderer;
  }

  const lodLevels = renderer.getLODLevels(object);
  if (lodLevels && lodLevels.length > 0) {
    const lod = deps.createLodObject(object, lodLevels);
    return lod;
  }

  console.warn(
    `[MeshFactory:GasGiant] Renderer for ${object.celestialObjectId} provided no valid LOD levels. Using fallback.`,
  );
  return createFallbackSphere(object);
}
