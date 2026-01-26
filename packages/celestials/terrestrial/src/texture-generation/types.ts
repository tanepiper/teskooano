/**
 * Types for the multi-pass terrain texture generation system.
 * @module texture-generation/types
 */

import type * as THREE from "three";
import type { AtmosphereType } from "@teskooano/data-types";

/**
 * Resolution options for generated textures.
 */
export interface TextureResolution {
  width: number;
  height: number;
}

/**
 * Standard texture resolutions.
 */
export const TEXTURE_RESOLUTIONS = {
  VERY_LOW: { width: 512, height: 256 } as TextureResolution, // ~3.5MB per planet
  LOW: { width: 1024, height: 512 } as TextureResolution, // ~14MB per planet
  MEDIUM: { width: 2048, height: 1024 } as TextureResolution, // ~58MB per planet
  HIGH: { width: 4096, height: 2048 } as TextureResolution, // ~234MB per planet
} as const;

/**
 * Configuration for the terrain texture generator.
 */
export interface TerrainTextureConfig {
  /** Texture resolution (default: MEDIUM) */
  resolution: TextureResolution;
  /** Seed for deterministic generation */
  seed: string;
  /** Whether to generate textures asynchronously */
  async: boolean;
}

/**
 * Input parameters for terrain generation passes.
 */
export interface TerrainGenerationInput {
  /** Seed for deterministic random generation */
  seed: string;
  /** Planet radius in meters (affects erosion scaling) */
  radiusMeters: number;
  /** Atmosphere type (affects crater distribution and erosion) */
  atmosphereType: AtmosphereType;
  /** Terrain type (1-4) */
  terrainType: number;
  /** Terrain amplitude */
  terrainAmplitude: number;
  /** Terrain sharpness */
  terrainSharpness: number;
  /** Terrain offset */
  terrainOffset: number;
  /** Noise persistence */
  persistence: number;
  /** Noise lacunarity */
  lacunarity: number;
  /** Noise octaves */
  octaves: number;
  /** Simple period for noise */
  simplePeriod: number;
  /** Undulation factor */
  undulation: number;
  /** Color palette (5 colors) */
  colors: [string, string, string, string, string];
  /** Height thresholds for color transitions */
  heightThresholds: [number, number, number, number, number];
  /** Bump scale for normal generation */
  bumpScale: number;
  /** Surface roughness */
  roughness: number;
}

/**
 * Output textures from the terrain generation pipeline.
 */
export interface GeneratedPlanetTextures {
  /** Height map (R channel = height 0-1) */
  heightMap: THREE.Texture;
  /** Normal map (RGB = normal direction) */
  normalMap: THREE.Texture;
  /** Color/albedo map (RGB = surface color) */
  colorMap: THREE.Texture;
  /** Roughness map (R channel = roughness 0-1) */
  roughnessMap: THREE.Texture;
  /** Texture resolution used */
  resolution: TextureResolution;
  /** Dispose all textures */
  dispose: () => void;
}

/**
 * Single crater definition for the crater pass.
 */
export interface CraterDefinition {
  /** Center position in UV space (0-1) */
  center: { x: number; y: number };
  /** Crater radius in UV space */
  radius: number;
  /** Crater depth (0-1) */
  depth: number;
  /** Rim height relative to depth */
  rimHeight: number;
  /** Whether crater has a central peak */
  hasCentralPeak: boolean;
  /** Age factor (0 = fresh, 1 = ancient/eroded) */
  age: number;
}

/**
 * Configuration for the crater generation pass.
 */
export interface CraterPassConfig {
  /** List of craters to generate */
  craters: CraterDefinition[];
  /** Atmosphere type (affects crater preservation) */
  atmosphereType: AtmosphereType;
}

/**
 * Configuration for the erosion pass.
 */
export interface ErosionPassConfig {
  /** Number of erosion iterations */
  iterations: number;
  /** Sediment capacity factor */
  sedimentCapacity: number;
  /** Deposition rate */
  depositionRate: number;
  /** Erosion rate */
  erosionRate: number;
  /** Evaporation rate */
  evaporationRate: number;
  /** Gravity factor */
  gravity: number;
  /** Inertia factor */
  inertia: number;
  /** Minimum slope for erosion */
  minSlope: number;
  /** Erosion brush radius */
  brushRadius: number;
  /** Whether to apply thermal erosion */
  enableThermalErosion: boolean;
  /** Thermal erosion rate */
  thermalErosionRate: number;
  /** Talus angle for thermal erosion (radians) */
  talusAngle: number;
}

/**
 * Default erosion parameters based on atmosphere type.
 */
export function getDefaultErosionConfig(
  atmosphereType: AtmosphereType,
  planetRadiusMeters: number,
): ErosionPassConfig {
  // Scale iterations based on planet size (Earth radius as baseline)
  const earthRadius = 6371000;
  const sizeScale = Math.sqrt(planetRadiusMeters / earthRadius);
  const baseIterations = 100000;

  switch (atmosphereType) {
    case "NONE":
      // No hydraulic erosion, only thermal
      return {
        iterations: 0,
        sedimentCapacity: 0,
        depositionRate: 0,
        erosionRate: 0,
        evaporationRate: 0,
        gravity: 4.0,
        inertia: 0.05,
        minSlope: 0.01,
        brushRadius: 3,
        enableThermalErosion: true,
        thermalErosionRate: 0.3,
        talusAngle: Math.PI / 4, // 45 degrees
      };

    case "THIN":
      // Light erosion
      return {
        iterations: Math.floor(baseIterations * 0.3 * sizeScale),
        sedimentCapacity: 2.0,
        depositionRate: 0.2,
        erosionRate: 0.2,
        evaporationRate: 0.02,
        gravity: 4.0,
        inertia: 0.1,
        minSlope: 0.01,
        brushRadius: 3,
        enableThermalErosion: true,
        thermalErosionRate: 0.2,
        talusAngle: Math.PI / 5,
      };

    case "NORMAL":
      // Full erosion
      return {
        iterations: Math.floor(baseIterations * sizeScale),
        sedimentCapacity: 4.0,
        depositionRate: 0.3,
        erosionRate: 0.3,
        evaporationRate: 0.01,
        gravity: 4.0,
        inertia: 0.05,
        minSlope: 0.01,
        brushRadius: 4,
        enableThermalErosion: true,
        thermalErosionRate: 0.15,
        talusAngle: Math.PI / 6,
      };

    case "DENSE":
    case "VERY_DENSE":
      // Heavy erosion, very smooth terrain
      return {
        iterations: Math.floor(baseIterations * 1.5 * sizeScale),
        sedimentCapacity: 6.0,
        depositionRate: 0.4,
        erosionRate: 0.4,
        evaporationRate: 0.005,
        gravity: 4.0,
        inertia: 0.03,
        minSlope: 0.005,
        brushRadius: 5,
        enableThermalErosion: true,
        thermalErosionRate: 0.1,
        talusAngle: Math.PI / 8,
      };

    default:
      // Fallback to normal
      return getDefaultErosionConfig(
        "NORMAL" as AtmosphereType,
        planetRadiusMeters,
      );
  }
}

/**
 * Get crater count range based on atmosphere type.
 */
export function getCraterCountRange(atmosphereType: AtmosphereType): {
  min: number;
  max: number;
} {
  switch (atmosphereType) {
    case "NONE":
      return { min: 50, max: 100 };
    case "THIN":
      return { min: 20, max: 50 };
    case "NORMAL":
      return { min: 5, max: 15 };
    case "DENSE":
      return { min: 2, max: 8 };
    case "VERY_DENSE":
      return { min: 0, max: 3 };
    default:
      return { min: 5, max: 15 };
  }
}
