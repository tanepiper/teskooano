import {
  CSS2DLayerType,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
import * as THREE from "three";
import type { MeshFactory } from "./object-manager/MeshFactory";
import type {
  LightManager,
  LODManager,
} from "@teskooano/renderer-threejs-effects";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { BasicCelestialRenderer } from "@teskooano/celestials-base";

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
  activeRenderers: Map<string, BasicCelestialRenderer>;
}

/**
 * @internal
 * Configuration for GravitationalLensingHandler.
 */

/**
 * @internal
 * Configuration object for ObjectLifecycleManager dependencies.
 */
export interface ObjectLifecycleManagerConfig {
  objects: Map<string, THREE.Object3D>;
  activeRenderers: Map<string, BasicCelestialRenderer>;
  scene: THREE.Scene;
  meshFactory: MeshFactory;
  lodManager: LODManager;
  lightManager: LightManager;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera;
  css2DManager?: CSS2DManager;
}

/**
 * @internal
 * Configuration for MeshFactory.
 */
export interface MeshFactoryConfig {
  lodManager: LODManager;
  camera: THREE.PerspectiveCamera;
}

/**
 * @internal
 * Dependencies for mesh creator functions used by MeshFactory.
 */
export interface CreatorDependencies {
  lodManager: LODManager;
  camera: THREE.PerspectiveCamera;
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
