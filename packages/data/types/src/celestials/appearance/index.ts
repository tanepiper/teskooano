import type * as THREE from "three";
// import type { OSVector3 } from "@teskooano/core-math"; // Not used directly here
import {
  // CelestialType, // Not used directly here
  // PlanetType, // Not used directly here
  RockyType,
  // SurfaceType, // Not used directly here
} from "../common";

// --- Base and Common Effects ---
export * from "./base";
export * from "./effects";
export * from "./surface";

// --- Specific Celestial Body Appearances ---
export * from "./star";
export * from "./planet";
export * from "./gas-giant";
export * from "./rings";
export * from "./comet";
export * from "./asteroid-field";
export * from "./oort-cloud";

// Import the base type for extension, others are in scope via export *
import type { CelestialAppearanceBase } from "./base";
// Note: StarAppearance, StandardPlanetAppearance, etc., are now available globally
// in this file due to the export * statements above.

// --- Visual Effects / Layers ---

/** Visual properties for atmospheric effects like glows or scattering. */
export interface AtmosphereEffectAppearance {
  glowColor?: string; // Hex string for glow
  intensity?: number; // Glow intensity (0-1)
  power?: number; // Glow power/falloff
  thickness?: number; // Glow thickness/spread
  // Potentially add mieScattering, rayleighScattering parameters for more advanced effects
}

/** Visual properties for cloud layers. */
export interface CloudLayerAppearance {
  color?: string; // Hex string
  opacity?: number; // (0-1)
  coverage?: number; // (0-1)
  speed?: number; // Animation speed
  texture?: string; // Path or identifier for cloud texture
  height?: number; // Relative height of cloud layer
}

// --- Surface Appearance Definitions ---

/**
 * Uniforms for procedural solid surface generation, primarily for shaders.
 * This was previously ProceduralSurfaceAppearanceData.
 */
export interface SolidSurfaceShaderUniforms {
  persistence: number; // (0-1)
  lacunarity: number; // (typically > 1)
  simplePeriod: number;
  octaves: number;
  bumpScale: number;
  color1: string; // Hex - Base color for the surface (lowest elevation)
  color2: string; // Hex - Second color gradient point
  color3: string; // Hex - Third color gradient point
  color4: string; // Hex - Fourth color gradient point
  color5: string; // Hex - Final color for the surface (highest elevation)
  height1: number; // (0-1) threshold for color1 transition
  height2: number; // (0-1) threshold for color2 transition
  height3: number; // (0-1) threshold for color3 transition
  height4: number; // (0-1) threshold for color4 transition
  height5: number; // (0-1) threshold for color5 transition
  shininess: number; // (e.g. 0-100 for Phong/Blinn-Phong)
  specularStrength: number; // (0-1)
  roughness: number; // (0-1, for PBR materials)
  ambientLightIntensity: number; // (0-1)
  undulation: number;
  terrainType: number; // (1=simple, 2=sharp peaks, 3=sharp valleys) - controls noise interpretation
  terrainAmplitude: number;
  terrainSharpness: number;
  terrainOffset: number;
  // Add specific uniforms for lava/ocean effects if controlled by the same shader
  // e.g., lavaFlowSpeed?: number; oceanWaveFrequency?: number;
  // emissiveColor?: string; // For lava, etc.
  // emissiveIntensity?: number;
}

/** Generic surface with a base color, roughness, and optional texture - for non-procedural objects. */
export interface SimpleSurfaceAppearance {
  type: "simple";
  baseColor: string; // Hex
  roughness: number; // (0-1)
  texture?: string; // Path or identifier
  secondaryColor?: string; // Hex, for variations
}

/** Surface rendered using procedural noise data and shader uniforms. */
export interface ProceduralSurfaceAppearance
  extends SolidSurfaceShaderUniforms {
  type: "procedural";
  // All properties from SolidSurfaceShaderUniforms are directly embedded here.
  // This type now directly holds all the shader parameters.
}

/** Union of all possible surface appearance types for solid bodies. */
export type SurfaceAppearanceUnion =
  | SimpleSurfaceAppearance // For basic, non-procedural surfaces
  | ProceduralSurfaceAppearance; // For all procedurally rendered solid surfaces (planets, moons)

// --- Ring System Appearance ---

/** Defines the visual properties of a single ring or a segment of a ring system. */
export interface RingProperties {
  innerRadius: number;
  outerRadius: number;
  density: number;
  opacity: number;
  color: string;
  tilt?: number;
  rotationRate?: number;
  texture: string;
  compositionType: RockyType;
}

export interface RingSystemAppearance extends CelestialAppearanceBase {
  rings: RingProperties[];
}

// --- Type-Specific Appearance Structures ---

/** Appearance for Stars. */
export interface StarAppearance extends CelestialAppearanceBase {
  color: string;
  coronaColor?: string;
  emissiveIntensity: number;
}

/** Appearance for standard solid planets, moons, dwarf planets. */
export interface StandardPlanetAppearance extends CelestialAppearanceBase {
  shapeModel?: "sphere" | "asteroid" | string; // Default 'sphere'
  surface?: SurfaceAppearanceUnion; // Now simplified
  atmosphere?: AtmosphereEffectAppearance;
  clouds?: CloudLayerAppearance;
}

/** Appearance for Gas Giants. */
export interface GasGiantAppearance extends CelestialAppearanceBase {
  atmosphereColor: string;
  cloudColor: string;
  cloudSpeed: number;
  stormColor?: string;
  stormSpeed?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
}

/** Appearance for Comets. */
export interface CometAppearance extends CelestialAppearanceBase {
  nucleusColor?: string; // Hex, color of the comet's solid nucleus
  comaColor?: string; // Hex with alpha, color of the coma
  comaRadius?: number; // Scaled units
  tailColor?: string; // Hex with alpha, color of the tail(s)
  maxTailLength?: number; // Scaled units
}

/** Appearance for Asteroid Fields. */
export interface AsteroidFieldAppearance extends CelestialAppearanceBase {
  baseColor: string; // Hex, average color of asteroids
  particleSize?: number; // Average size for rendered particles/impostors
  density?: number; // Visual density for particle systems
}

/** Appearance for Oort Clouds (typically particle-based). */
export interface OortCloudAppearance extends CelestialAppearanceBase {
  particleColor: string; // Hex
  particleDensity: number;
  particleCount: number; // Suggestion for rendering systems
}

// --- Union of all Celestial Appearance types ---
// All imported types (StarAppearance, StandardPlanetAppearance, etc.) are available
// here because of the 'export *' statements at the top of the file.
export type CelestialAppearanceUnion =
  | CelestialAppearanceBase // Fallback for types with no specific appearance yet
  | StarAppearance
  | StandardPlanetAppearance
  | GasGiantAppearance
  | CometAppearance
  | AsteroidFieldAppearance
  | OortCloudAppearance
  | RingSystemAppearance;
