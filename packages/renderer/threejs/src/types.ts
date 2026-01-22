import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import type { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import type { BackgroundManager } from "@teskooano/renderer-threejs-background";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type {
  GridManager,
  SceneManager,
} from "@teskooano/renderer-threejs-core";
import * as THREE from "three";
import { WebGLRendererParameters } from "three";

import {
  LabelVisibilityConfig,
  Layer2DManager,
} from "@teskooano/renderer-threejs-labels";
import { ControlsManager } from "@teskooano/renderer-threejs-controls";
import { SimulationConfiguration } from "@teskooano/data-types";

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
  /** The simulation configuration for rendering-specific decisions. */
  simulationConfig: SimulationConfiguration;
  /** The time scale for the simulation. */
  timeScale: number;
  /** The number of steps for the simulation. */
  predictionSteps: number;
  /** The duration of the prediction in seconds. */
  predictionDuration: number;
  /** The visualization mode for Keplerian orbits (only relevant in Ideal mode). */
  keplerOrbitMode: "full" | "trail";
}

/**
 * Defines the configuration options for creating a `ModularSpaceRenderer`.
 */
export interface ModularSpaceRendererOptions extends WebGLRendererParameters {
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
  labelConfig?: LabelVisibilityConfig;
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
  lightingManager: LightingManager;
  /** The manager for the grid helper. */
  gridManager: GridManager;

  /** The optional manager for 2D HTML labels. */
  css2DManager: Layer2DManager;
}

/**
 * Defines a function that can be invoked from the console
 */
export type RenderCallback = () => void;
