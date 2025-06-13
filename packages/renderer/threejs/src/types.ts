import type { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialSpecificPropertiesUnion,
  CelestialStatus,
  CelestialType,
  OrbitalParameters,
} from "@teskooano/data-types";
import type * as THREE from "three";
import type {
  AnimationLoop,
  SceneManager,
} from "@teskooano/renderer-threejs-core";
import type { LightManager } from "@teskooano/renderer-threejs-lighting";
import type { LODManager } from "@teskooano/renderer-threejs-lod";
import type {
  ControlsManager,
  CSS2DManager,
} from "@teskooano/renderer-threejs-interaction";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import type { BackgroundManager } from "@teskooano/renderer-threejs-background";

/**
 * Defines a collection of values intended to be passed as uniforms to shaders.
 * This keeps the parent `RenderableCelestialObject` interface generic.
 */
export interface RenderableObjectUniforms {
  /** The surface or effective temperature of the object in Kelvin. */
  temperature?: number;
}

/**
 * Defines global visual settings that can affect multiple renderer components,
 * allowing for consistent visual behavior across the scene.
 */
export interface RendererVisualSettings {
  /** A multiplier that adjusts the length of orbital trails. */
  trailLengthMultiplier: number;
  /** The physics engine currently used for orbital calculations. */
  physicsEngine: "keplerian" | "verlet";
}

/**
 * Defines the configuration options for creating a `ModularSpaceRenderer`.
 */
export interface ModularSpaceRendererOptions {
  /** Enables/disables antialiasing. */
  antialias?: boolean;
  /** Enables/disables shadows. */
  shadows?: boolean;
  /** Enables/disables High Dynamic Range rendering for lighting. */
  hdr?: boolean;
  /** Sets the initial background. Can be a color string or a texture. */
  background?: string | THREE.Texture;
  /** Sets the initial visibility of the debug grid. */
  showGrid?: boolean;
  /** Sets the initial visibility of 2D object labels. */
  showCelestialLabels?: boolean;
  /** Sets the initial visibility of Astronomical Unit markers. */
  showAuMarkers?: boolean;
  /** Sets the initial visibility of particle effects for destroyed objects. */
  showDebrisEffects?: boolean;
  grid?: "polar" | "cartesian";
}

/**
 * Defines the dependencies required by the `RenderPipeline`.
 */
export interface RenderPipelineOptions {
  /** The manager for the core THREE.Scene, camera, and renderer. */
  sceneManager: SceneManager;
  /** The manager for user interaction and camera controls. */
  controlsManager: ControlsManager;
  /** The manager for visualizing orbital paths. */
  orbitManager: OrbitsManager;
  /** The manager for creating and updating 3D objects. */
  objectManager: ObjectManager;
  /** The manager for the skybox and background. */
  backgroundManager: BackgroundManager;
  /** The manager for scene lighting. */
  lightManager: LightManager;
  /** The manager for Level of Detail. */
  lodManager: LODManager;
  /** The manager for the main animation loop. */
  animationLoop: AnimationLoop;
  /** The optional manager for 2D HTML labels. */
  css2DManager?: CSS2DManager;
  /** The optional manager for rendering custom 2D canvas UI. */
  canvasUIManager?: { render(): void };
}

/**
 * Defines a function that can be invoked from the console
 */
