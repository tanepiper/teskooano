/**
 * Performance-related type definitions for the Teskooano engine.
 * These types are used across rendering, physics, and UI systems to ensure
 * consistent performance configuration and optimization.
 */

/**
 * Represents the performance tier of a device based on hardware capabilities.
 * Used for automatic performance optimization and user-configurable quality settings.
 */
export type DeviceTier = "low" | "medium" | "high" | "cosmic";

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
  shadowMapType: any; // THREE.ShadowMapType
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

/**
 * WebGL capabilities information for performance optimization.
 */
export interface WebGLCapabilities {
  /** Whether WebGL 2 is supported */
  isWebGL2: boolean;
  /** Precision level supported */
  precision: string;
  /** Maximum number of texture units */
  maxTextures: number;
  /** Maximum texture size (width/height) */
  maxTextureSize: number;
  /** Maximum vertex uniform vectors */
  maxVertexUniforms: number;
  /** Maximum fragment uniform vectors */
  maxFragmentUniforms: number;
  /** Maximum varying vectors */
  maxVaryings: number;
  /** Maximum vertex attributes */
  maxAttributes: number;
  /** Whether vertex textures are supported */
  vertexTextures: boolean;
  /** Maximum number of samples for MSAA */
  maxSamples: number;
  /** Whether logarithmic depth buffer is supported */
  logarithmicDepthBuffer: boolean;
  /** Whether reverse depth buffer is supported */
  reverseDepthBuffer: boolean;
}
