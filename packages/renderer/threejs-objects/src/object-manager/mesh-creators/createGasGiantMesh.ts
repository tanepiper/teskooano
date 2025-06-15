import {
  CelestialType,
  GasGiantClass,
  GasGiantProperties,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { CelestialRenderer } from "@teskooano/systems-celestial";
import { createGasGiantRenderer } from "@teskooano/systems-celestial";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { createFallbackSphere } from "./createFallbackSphere";

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

  // Use the factory to create a new renderer instance.
  const renderer = createGasGiantRenderer(rendererKey);

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
