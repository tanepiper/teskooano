import {
  CSS2DLayerType,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
import {
  CelestialRenderer,
  RingSystemRenderer,
  LODLevel,
} from "packages/systems/celestial/src";
import * as THREE from "three";
import type { MeshFactory } from "./object-manager/MeshFactory";
import type { GravitationalLensingHandler } from "./object-manager/GravitationalLensing";
import type {
  LightManager,
  LODManager,
} from "@teskooano/renderer-threejs-effects";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * @internal Interface defining the required methods for managing label visibility.
 *          This allows decoupling from the full CSS2DManager if needed.
 */
export interface LabelVisibilityManager {
  showLabel(layer: CSS2DLayerType, id: string): void;
  hideLabel(layer: CSS2DLayerType, id: string): void;
  isLayerVisible(layer: CSS2DLayerType): boolean;
}

/**
 * @internal
 * Configuration for RendererUpdater.
 */
export interface RendererUpdaterConfig {
  celestialRenderers: Map<string, CelestialRenderer>;
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
  ringSystemRenderers: Map<string, RingSystemRenderer>;
  asteroidRenderers: Map<string, CelestialRenderer>;
}

/**
 * @internal
 * Configuration for GravitationalLensingHandler.
 */
export interface GravitationalLensingHandlerConfig {
  starRenderers: Map<string, CelestialRenderer>;
  // Add other dependencies if they exist, e.g., post-processing manager
}

/**
 * @internal
 * Configuration object for ObjectLifecycleManager dependencies.
 */
export interface ObjectLifecycleManagerConfig {
  objects: Map<string, THREE.Object3D>;
  scene: THREE.Scene;
  meshFactory: MeshFactory;
  lodManager: LODManager;
  lightManager: LightManager;
  lensingHandler: GravitationalLensingHandler;
  renderer: THREE.WebGLRenderer | null;
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
  ringSystemRenderers: Map<string, RingSystemRenderer>;
  asteroidRenderers: Map<string, CelestialRenderer>;
  camera: THREE.PerspectiveCamera;
  css2DManager?: CSS2DManager;
}

/**
 * @internal
 * Configuration for MeshFactory.
 */
export interface MeshFactoryConfig {
  celestialRenderers: Map<string, CelestialRenderer>;
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
  ringSystemRenderers: Map<string, RingSystemRenderer>;
  asteroidRenderers: Map<string, CelestialRenderer>;
  lodManager: LODManager;
  camera: THREE.PerspectiveCamera;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Dependencies for mesh creator functions used by MeshFactory.
 */
export interface CreatorDependencies {
  starRenderers: Map<string, CelestialRenderer>;
  planetRenderers: Map<string, CelestialRenderer>;
  moonRenderers: Map<string, CelestialRenderer>;
  ringSystemRenderers: Map<string, RingSystemRenderer>;
  asteroidRenderers: Map<string, CelestialRenderer>;
  celestialRenderers: Map<string, CelestialRenderer>;
  createLodCallback: (
    object: RenderableCelestialObject,
    levels: LODLevel[],
  ) => THREE.LOD;
}

/**
 * @internal
 * Configuration for AccelerationVisualizer.
 */
export interface AccelerationVisualizerConfig {
  objects: Map<string, THREE.Object3D>;
  arrowScaleFactor?: number;
  arrowColor?: number;
}

/**
 * @internal
 * Configuration for DebrisEffectManager.
 */
export interface DebrisEffectManagerConfig {
  scene: THREE.Scene;
}

/**
 * @internal
 * Represents an active instanced debris effect.
 */
export interface ActiveInstancedDebris {
  mesh: THREE.InstancedMesh;
  startTime: number;
  lifetime: number;
  material: THREE.ShaderMaterial; // Or RawShaderMaterial
}
