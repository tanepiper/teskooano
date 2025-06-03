import type { AtmosphereType, RingType } from "./common";
import { ProceduralSurfaceProperties } from "./common/procedural-surface-properties";
import { SurfaceType } from "./common/physical-properties";

/**
 * Surface properties for solid bodies
 */
export interface SurfaceProperties {
  surfaceType: SurfaceType;
  proceduralData?: ProceduralSurfaceProperties;
}

/**
 * Atmospheric properties with proper typing
 */
export interface AtmosphereProperties {
  type: AtmosphereType; // Atmospheric density classification
  pressure_pa: number; // Surface pressure in Pascals
  density_kgm3: number; // Atmospheric density
  scaleHeight_m: number; // Atmospheric scale height

  // Visual properties
  glowColor?: string; // Atmospheric glow color (hex)
  intensity?: number; // Glow intensity (0-1)
  power?: number; // Atmospheric scattering power
  thickness?: number; // Visual thickness (0-1)
}

/**
 * Individual ring properties with proper typing
 */
export interface RingProperties {
  innerRadius: number; // Inner radius (normalized to planet radius)
  outerRadius: number; // Outer radius (normalized to planet radius)
  density: number; // Particle density (0-1)
  opacity: number; // Visual opacity (0-1)
  color: string; // Hex color
  tilt?: number; // Ring tilt in radians
  rotationRate?: number; // Ring rotation rate
  texture?: string; // Texture identifier
  type: RingType; // Ring classification
}

/**
 * Cloud properties for atmospheric bodies
 */
export interface CloudProperties {
  color: string; // Cloud color (hex)
  opacity: number; // Cloud opacity (0-1)
  coverage: number; // Cloud coverage (0-1)
  speed: number; // Cloud movement speed
}
