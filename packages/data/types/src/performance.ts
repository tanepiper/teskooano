/**
 * Performance-related type definitions for the Teskooano engine.
 * These types are used across rendering, physics, and UI systems to ensure
 * consistent performance configuration and optimization.
 */

import type { ShadowMapType, WebGLCapabilities } from "three";

/**
 * Configuration options for creating a SceneManager instance.
 * This provides a strongly-typed contract for initializing the core scene components.
 */
export interface SceneManagerOptions {
  /** Enables or disables anti-aliasing. Defaults to true. */
  antialias?: boolean;
  /** Enables or disables shadow mapping. Defaults to true. */
  shadows?: boolean;
  /** Enables or disables the High Dynamic Range (HDR) rendering pipeline with ACES Filmic tone mapping. Defaults to true. */
  hdr?: boolean;
  /** The camera's vertical Field of View (FOV) in degrees. Defaults to 75. */
  fov?: number;
  /** Initial camera position [x, y, z]. Defaults to [0, 20, 50]. */
  cameraPosition?: [number, number, number];
  /** Initial camera target [x, y, z]. Defaults to [0, 0, 0]. */
  cameraTarget?: [number, number, number];
  /** Preferred renderer backend (WebGPU or WebGL). Defaults to 'webgpu' with fallback to 'webgl'. */
  rendererBackend?: RendererBackend;
}

/**
 * Represents the performance tier of a device based on hardware capabilities.
 * Used for automatic performance optimization and user-configurable quality settings.
 */
export type DeviceTier = "low" | "medium" | "high" | "cosmic";

/**
 * Renderer backend type - WebGPU only.
 * The codebase has fully migrated to WebGPU using Three.js TSL (Three.js Shading Language).
 */
export type RendererBackend = "webgpu";

/**
 * Renderer backend capabilities and selection.
 * Tracks WebGPU availability and initialization status.
 */
export interface RendererBackendConfig {
  /** Renderer backend (always 'webgpu') */
  backend: RendererBackend;
  /** Whether WebGPU is supported by the browser */
  webgpuAvailable: boolean;
  /** Whether WebGPU renderer is initialized and ready */
  initialized: boolean;
}

/**
 * Configuration for performance-based geometry optimization.
 */
export interface PerformanceConfig {
  /** Target FPS for performance calculations */
  targetFPS?: number;
  /** Current FPS (will be updated dynamically) */
  currentFPS?: number;
  /** Whether to enable performance-based segment reduction */
  enablePerformanceOptimization?: boolean;
  /** Multiplier for segment reduction when performance is poor (0.5 = 50% reduction) */
  performanceReductionMultiplier?: number;
  /** Minimum segments to maintain even under poor performance */
  minimumSegments?: number;
  /** Device performance tier */
  deviceTier?: DeviceTier;
  /** Whether to enable adaptive segment scaling based on object size */
  enableAdaptiveScaling?: boolean;
  /** Distance-based segment reduction factor */
  distanceReductionFactor?: number;
}

/**
 * Performance optimization settings for rendering.
 * Defines performance optimization settings based on device capabilities.
 */
export interface PerformanceOptimization {
  /** Whether to enable anti-aliasing */
  antialias: boolean;
  /** Whether to enable shadow mapping */
  shadows: boolean;
  /** Whether to enable High Dynamic Range rendering */
  hdr: boolean;
  /** Pixel ratio for rendering (1.0 = native, 2.0 = retina) */
  pixelRatio: number;
  /** Type of shadow mapping to use */
  shadowMapType: ShadowMapType;
  /** Maximum number of lights to render */
  maxLights: number;
  /** Maximum number of shadow casters */
  maxShadowCasters: number;
  /** LOD distance multiplier (higher = switch to lower detail sooner) */
  lodDistanceMultiplier: number;
  /** Quality level for trail rendering */
  trailQuality: "low" | "medium" | "high";
  /** Multiplier for particle count */
  particleCountMultiplier: number;
}
